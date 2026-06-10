/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

const TOTAL_CR_BLIS = 11;
const PAGE_SIZE = 10;

// Agreement 19: used to set up a pending pre-award approval (visible to division-director).
// Agreement 20: used to set up an approved pre-award step (becomes a budget requisition for budget-team).
// Both have project_officer_id: 500 and CANs under division 4 (Dave Director's division).
const PRE_AWARD_PENDING_AGREEMENT_ID = 19;
const PRE_AWARD_APPROVED_AGREEMENT_ID = 20;

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: `E2E CR Pagination ${Date.now()}`,
    contract_type: "FIRM_FIXED_PRICE",
    description: "Test pagination of change requests list",
    service_requirement_type: "NON_SEVERABLE",
    project_id: 1000,
    product_service_code_id: 1,
    awarding_entity_id: 2,
    project_officer_id: 500,
    team_members: [{ id: 520 }, { id: 504 }]
};

// CAN 501 is in a portfolio under division 4 (Dave Director's division)
const baseBli = {
    line_description: "SC1",
    can_id: 501,
    amount: 1_000_000,
    status: BLI_STATUS.DRAFT,
    date_needed: "2044-01-01",
    proc_shop_fee_percentage: 5,
    services_component_id: 1
};

/**
 * Fetches the PRE_AWARD step for an agreement and completes steps 1-4 (if not already COMPLETED),
 * then calls onReady(preAwardStepId) so the caller can further patch the PRE_AWARD step.
 */
const setupPreAwardStep = (agreementId, token, onReady) => {
    cy.request({
        method: "GET",
        url: `http://localhost:8080/api/v1/procurement-trackers/?agreement_id=${agreementId}`,
        headers: { Authorization: token }
    }).then((res) => {
        expect(res.status).to.eq(200);
        const tracker = res.body.data[0];
        expect(tracker).to.exist;

        const stepsSorted = [...tracker.steps].sort((a, b) => a.step_number - b.step_number);
        const stepsToComplete = stepsSorted.filter((s) => s.step_number <= 4 && s.status !== "COMPLETED");
        const preAwardStep = stepsSorted.find((s) => s.step_type === "PRE_AWARD");

        const completeStep = (steps) => {
            if (steps.length === 0) {
                cy.then(() => onReady(preAwardStep));
                return;
            }
            const [step, ...rest] = steps;
            cy.request({
                method: "PATCH",
                url: `http://localhost:8080/api/v1/procurement-tracker-steps/${step.id}`,
                body: { status: "COMPLETED", task_completed_by: 500, date_completed: "2026-01-10" },
                headers: { Authorization: token, "Content-Type": "application/json" }
            }).then((patchRes) => {
                expect(patchRes.status).to.be.oneOf([200, 202]);
                completeStep(rest);
            });
        };

        completeStep(stepsToComplete);
    });
};

describe("Change Requests List - Pagination", () => {
    let agreementId;
    let bliIds = [];
    let budgetTeamToken;
    let divisionDirectorToken;

    before(() => {
        testLogin("system-owner");
        cy.then(() => {
            const systemOwnerToken = `Bearer ${window.localStorage.getItem("access_token")}`;

            // --- Agreement 19: pending pre-award approval (visible to division-director) ---
            setupPreAwardStep(PRE_AWARD_PENDING_AGREEMENT_ID, systemOwnerToken, (preAwardStep) => {
                if (!preAwardStep.approval_requested) {
                    cy.request({
                        method: "PATCH",
                        url: `http://localhost:8080/api/v1/procurement-tracker-steps/${preAwardStep.id}`,
                        body: { approval_requested: true, approval_requested_date: "2026-01-15" },
                        headers: { Authorization: systemOwnerToken, "Content-Type": "application/json" }
                    }).then((res) => {
                        expect(res.status).to.be.oneOf([200, 202]);
                    });
                }
            });

            // --- Agreement 20: approved pre-award (visible to budget-team as requisition) ---
            setupPreAwardStep(PRE_AWARD_APPROVED_AGREEMENT_ID, systemOwnerToken, (preAwardStep) => {
                if (!preAwardStep.approval_requested) {
                    cy.request({
                        method: "PATCH",
                        url: `http://localhost:8080/api/v1/procurement-tracker-steps/${preAwardStep.id}`,
                        body: { approval_requested: true, approval_requested_date: "2026-01-12" },
                        headers: { Authorization: systemOwnerToken, "Content-Type": "application/json" }
                    }).then((res) => {
                        expect(res.status).to.be.oneOf([200, 202]);
                    });
                }
            });
        });

        // Approve the agreement 20 pre-award step as division-director so it becomes a requisition
        testLogin("division-director");
        cy.then(() => {
            divisionDirectorToken = `Bearer ${window.localStorage.getItem("access_token")}`;

            cy.request({
                method: "GET",
                url: `http://localhost:8080/api/v1/procurement-trackers/?agreement_id=${PRE_AWARD_APPROVED_AGREEMENT_ID}`,
                headers: { Authorization: divisionDirectorToken }
            }).then((res) => {
                expect(res.status).to.eq(200);
                const tracker = res.body.data[0];
                const preAwardStep = tracker.steps.find((s) => s.step_type === "PRE_AWARD");
                if (preAwardStep.approval_status !== "APPROVED") {
                    cy.request({
                        method: "PATCH",
                        url: `http://localhost:8080/api/v1/procurement-tracker-steps/${preAwardStep.id}`,
                        body: { approval_status: "APPROVED" },
                        headers: { Authorization: divisionDirectorToken, "Content-Type": "application/json" }
                    }).then((patchRes) => {
                        expect(patchRes.status).to.be.oneOf([200, 202]);
                    });
                }
            });
        });

        // --- Create agreement + 11 BLIs with status-change CRs (visible to division-director) ---
        testLogin("budget-team");
        cy.then(() => {
            budgetTeamToken = `Bearer ${window.localStorage.getItem("access_token")}`;

            cy.request({
                method: "POST",
                url: "http://localhost:8080/api/v1/agreements/",
                body: { ...testAgreement, name: `E2E CR Pagination ${Date.now()}` },
                headers: { Authorization: budgetTeamToken, "Content-Type": "application/json" }
            }).then((res) => {
                expect(res.status).to.eq(201);
                agreementId = res.body.id;

                const createAndPatch = (remaining, acc) => {
                    if (remaining === 0) return cy.wrap(acc);
                    return cy
                        .request({
                            method: "POST",
                            url: "http://localhost:8080/api/v1/budget-line-items/",
                            body: { ...baseBli, agreement_id: agreementId },
                            headers: { Authorization: budgetTeamToken }
                        })
                        .then((bliRes) => {
                            expect(bliRes.status).to.eq(201);
                            const bliId = bliRes.body.id;
                            return cy
                                .request({
                                    method: "PATCH",
                                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                                    body: { id: bliId, status: BLI_STATUS.PLANNED },
                                    headers: { Authorization: budgetTeamToken }
                                })
                                .then((patchRes) => {
                                    expect(patchRes.status).to.eq(202);
                                    return createAndPatch(remaining - 1, [...acc, bliId]);
                                });
                        });
                };

                createAndPatch(TOTAL_CR_BLIS, []).then((ids) => {
                    bliIds = ids;
                });
            });
        });
    });

    after(() => {
        // Agreement 19: division-director declines the pending pre-award approval, removing it from the list.
        testLogin("division-director");
        cy.then(() => {
            const ddToken = `Bearer ${window.localStorage.getItem("access_token")}`;
            cy.request({
                method: "GET",
                url: `http://localhost:8080/api/v1/procurement-trackers/?agreement_id=${PRE_AWARD_PENDING_AGREEMENT_ID}`,
                headers: { Authorization: ddToken },
                failOnStatusCode: false
            }).then((res) => {
                if (res.status !== 200) return;
                const preAwardStep = res.body.data?.[0]?.steps?.find((s) => s.step_type === "PRE_AWARD");
                if (preAwardStep?.approval_status === null || preAwardStep?.approval_status === undefined) {
                    cy.request({
                        method: "PATCH",
                        url: `http://localhost:8080/api/v1/procurement-tracker-steps/${preAwardStep.id}`,
                        body: { approval_status: "DECLINED" },
                        headers: { Authorization: ddToken, "Content-Type": "application/json" },
                        failOnStatusCode: false
                    });
                }
            });
        });

        // Agreement 20: budget-team submits the requisition, removing it from the pending requisitions list.
        testLogin("budget-team");
        cy.then(() => {
            const btToken = `Bearer ${window.localStorage.getItem("access_token")}`;
            cy.request({
                method: "GET",
                url: `http://localhost:8080/api/v1/procurement-trackers/?agreement_id=${PRE_AWARD_APPROVED_AGREEMENT_ID}`,
                headers: { Authorization: btToken },
                failOnStatusCode: false
            }).then((res) => {
                if (res.status !== 200) return;
                const preAwardStep = res.body.data?.[0]?.steps?.find((s) => s.step_type === "PRE_AWARD");
                if (preAwardStep && !preAwardStep.requisition_approved_by) {
                    cy.request({
                        method: "PATCH",
                        url: `http://localhost:8080/api/v1/procurement-tracker-steps/${preAwardStep.id}`,
                        body: { requisition_number: "CLEANUP-REQ-001", requisition_date: "2026-01-20" },
                        headers: { Authorization: btToken, "Content-Type": "application/json" },
                        failOnStatusCode: false
                    });
                }
            });
        });

        testLogin("system-owner");
        cy.then(() => {
            const token = `Bearer ${window.localStorage.getItem("access_token")}`;

            bliIds.forEach((id) => {
                cy.request({
                    method: "DELETE",
                    url: `http://localhost:8080/api/v1/budget-line-items/${id}`,
                    headers: { Authorization: token },
                    failOnStatusCode: false
                });
            });
            if (agreementId) {
                cy.request({
                    method: "DELETE",
                    url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
                    headers: { Authorization: token }
                }).then((res) => {
                    expect(res.status).to.eq(200);
                });
            }
        });
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("shows 10 items on page 1, shows pagination, and a pre-award approval card appears somewhere in the list", () => {
        testLogin("division-director");
        cy.intercept({ method: "GET", url: "**/change-requests/**" }).as("changeRequests");
        cy.intercept({ method: "GET", url: "**/procurement-tracker-steps/pending-approvals/" }).as("preAwardApprovals");
        cy.visit("/agreements?filter=change-requests");
        cy.wait(["@changeRequests", "@preAwardApprovals"]);

        // Page 1 should show exactly PAGE_SIZE items
        cy.get("[data-cy='review-card']").should("have.length", PAGE_SIZE);

        // Pagination nav should be visible
        cy.get("nav[aria-label='Pagination']").should("exist");
        cy.get("button.usa-current").should("contain", "1");

        // Walk through pages until the pre-award card is found.
        // It sorts after the freshly-created CRs (which have newer dates), so it won't be on page 1.
        const findPreAwardCard = () => {
            cy.get("body").then(($body) => {
                if ($body.find("[data-cy='pre-award-review-card']").length > 0) return;
                cy.get("button.usa-current")
                    .invoke("text")
                    .then((currentPageText) => {
                        const nextPage = parseInt(currentPageText.trim()) + 1;
                        cy.get("body").then(($b) => {
                            if ($b.find(`button[aria-label="Page ${nextPage}"]`).length === 0) {
                                // No more pages — force the assertion to fail with a clear message
                                cy.get("[data-cy='pre-award-review-card']").should("exist");
                            } else {
                                cy.get(`button[aria-label="Page ${nextPage}"]`).click();
                                findPreAwardCard();
                            }
                        });
                    });
            });
        };

        findPreAwardCard();
    });

    it("shows at least one budget requisition card when logged in as budget-team", () => {
        testLogin("budget-team");
        cy.intercept({ method: "GET", url: "**/procurement-tracker-steps/pending-requisitions/" }).as(
            "budgetRequisitions"
        );
        cy.visit("/agreements?filter=change-requests");
        cy.wait("@budgetRequisitions");

        cy.get("[data-cy='budget-team-requisition-review-card']").should("have.length.at.least", 1);
    });
});
