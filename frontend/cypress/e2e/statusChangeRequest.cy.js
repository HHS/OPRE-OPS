/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

let testAgreement = {
    agreement_type: "CONTRACT",
    contract_type: "FIRM_FIXED_PRICE",
    agreement_reason: "NEW_REQ",
    name: "E2E Status Change Request",
    description: "Test Description",
    service_requirement_type: "NON_SEVERABLE",
    project_id: 1000,
    product_service_code_id: 1,
    awarding_entity_id: 2,
    project_officer_id: 500,
    team_members: [
        {
            id: 520
        },
        {
            id: 504
        }
    ],
    notes: "Test Notes"
};

const testBli = {
    line_description: "SC1",
    comments: "",
    can_id: 504,
    agreement_id: 11,
    amount: 1_000_000,
    status: BLI_STATUS.DRAFT,
    date_needed: "2044-01-01",
    proc_shop_fee_percentage: 0.005,
    services_component_id: testAgreement["awarding_entity_id"]
};

const HISTORY_POLL_INTERVAL_MS = 1000;
const HISTORY_TIMEOUT_MS = 20000;

beforeEach(() => {
    // append a unique identifier to the agreement name to avoid conflicts
    const uniqueId = Date.now();
    testAgreement.name = `E2E Status Change Request ${uniqueId}`;

    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

const waitForAgreementHistory = (agreementId, bearer_token, startedAt = Date.now()) => {
    const historyUrl = `http://localhost:8080/api/v1/agreement-history/${agreementId}?limit=20&offset=0`;
    return cy
        .request({
            method: "GET",
            url: historyUrl,
            headers: {
                Authorization: bearer_token,
                Accept: "application/json"
            },
            failOnStatusCode: false
        })
        .then((response) => {
            const hasEntries = response.status === 200 && Array.isArray(response.body) && response.body.length > 0;
            if (hasEntries) {
                return;
            }
            const elapsedMs = Date.now() - startedAt;
            if (elapsedMs >= HISTORY_TIMEOUT_MS) {
                expect(response.status, "agreement history status").to.eq(200);
                expect(response.body, "agreement history entries").to.be.an("array").and.have.length.greaterThan(0);
                return;
            }
            cy.wait(HISTORY_POLL_INTERVAL_MS);
            return waitForAgreementHistory(agreementId, bearer_token, startedAt);
        });
};

it("BLI Status Change", () => {
    expect(localStorage.getItem("access_token")).to.exist;

    // create test agreement
    const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
    cy.request({
        method: "POST",
        url: "http://localhost:8080/api/v1/agreements/",
        body: testAgreement,
        headers: {
            Authorization: bearer_token,
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    })
        .then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
            const agreementId = response.body.id;
            return agreementId;
        })
        // create BLI
        .then((agreementId) => {
            const bliData = { ...testBli, agreement_id: agreementId };
            cy.request({
                method: "POST",
                url: "http://localhost:8080/api/v1/budget-line-items/",
                body: bliData,
                headers: {
                    Authorization: bearer_token,
                    Accept: "application/json"
                }
            }).then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body.id).to.exist;
                const bliId = response.body.id;
                return { agreementId, bliId };
            });
        })
        // submit for approval (via REST for now, maybe change to UI click through)
        .then(({ agreementId, bliId }) => {
            cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
            cy.get('[data-cy="bli-continue-btn"]').click();
            // Wait for the change request form to appear
            cy.get('input[id="Change Draft Budget Lines to Planned Status"]', { timeout: 10000 })
                .should("be.visible")
                .check({ force: true });
            // Ensure the "check all" box is actually checked in CI
            cy.get("#check-all-0", { timeout: 10000 }).should("be.visible").check({ force: true });
            cy.get("#check-all-0", { timeout: 10000 }).should("be.checked");
            cy.get('[type="checkbox"]', { timeout: 10000 })
                .should("have.length", 2)
                .each((checkbox) => {
                    cy.wrap(checkbox).should("be.checked");
                });
            cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
            cy.get('[data-cy="review-card"]').within(() => {
                cy.contains(bliId);
                cy.contains("System Owner");
                cy.contains("Status");
                cy.contains("Draft");
                cy.contains("Planned");
                cy.contains("$1,000,000.00");
            });
            // type pls approve in the #submitter-notes textarea
            cy.get("#submitter-notes").type("pls approve");
            cy.get('[data-cy="send-to-approval-btn"]').click();
            cy.get(".usa-alert__body")
                .should("contain", "Changes Sent to Approval")
                .and("contain", `BL ${bliId} Status: Draft to Planned`)
                .and("contain", "pls approve");
            waitForAgreementHistory(agreementId, bearer_token);
            cy.visit(`/agreements/${agreementId}`);
            cy.get(".usa-breadcrumb__list > :nth-child(3)").should("have.text", testAgreement.name);
            cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
            cy.get('[data-cy="agreement-history-container"]').should("exist");
            cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
            cy.get('[data-cy="agreement-history-list"]').should("exist");
            cy.get('[data-cy="agreement-history-list"]', { timeout: 30000 }).should(($list) => {
                expect($list.children().length).to.be.at.least(1);
            });
            cy.get(
                '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
            ).should("exist");
            cy.get(
                '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
            ).should("have.text", "Status Change to Planned In Review");
            cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]').should("exist");
            cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]')
                .should(
                    "have.text",
                    `System Owner requested a status change on BL ${bliId} from Draft to Planned and it's currently In Review for approval.`
                )
                .then(() => {
                    cy.request({
                        method: "DELETE",
                        url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                        headers: {
                            Authorization: bearer_token,
                            Accept: "application/json"
                        }
                    }).then((response) => {
                        expect(response.status).to.eq(200);
                    });
                })
                .then(() => {
                    cy.request({
                        method: "DELETE",
                        url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
                        headers: {
                            Authorization: bearer_token,
                            Accept: "application/json"
                        }
                    }).then((response) => {
                        expect(response.status).to.eq(200);
                    });
                });
        });
});
