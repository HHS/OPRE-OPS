/// <reference types="cypress" />

import { testLogin } from "./utils";

// Seeded Awarded contract with Obligated budget lines (OPS-3072 manual-testing fixture). Its
// seeded Planned budget line is in a future FY, so the spec adds a current-FY one to execute and
// deletes it afterwards (seeding one would change the Procurement Dashboard's current-FY counts).
const AGREEMENT_ID = 523;
const SERVICES_COMPONENT_ID = 55;
const CAN_ID = 504;
const API = "http://localhost:8080/api/v1";

/** Request with the signed-in user's token, read when the command runs (not when it's queued). */
const apiRequest = (options) =>
    cy.window().then((win) =>
        cy.request({
            ...options,
            url: `${API}${options.url}`,
            headers: { Authorization: `Bearer ${win.localStorage.getItem("access_token")}`, Accept: "application/json" }
        })
    );

/** Decline any contract modification left in review, so the one-at-a-time rule doesn't block a rerun. */
const declineOpenContractModifications = () => {
    testLogin("division-director");
    apiRequest({ url: `/agreements/${AGREEMENT_ID}/contract-modifications/` }).then((response) => {
        response.body.data
            .filter((request) => request.status === "IN_REVIEW")
            .forEach((request) =>
                apiRequest({
                    method: "PATCH",
                    url: `/contract-modification-requests/${request.id}/`,
                    body: { action: "DECLINE", reviewer_notes: "E2E cleanup" }
                })
            );
    });
};

/**
 * Approve the contract modification in review as the Division Director, through the API: the review
 * card is a placeholder and isn't shown on the Award & Modifications tab yet (#3269; review UI is #3331).
 */
const approveOpenContractModification = () => {
    testLogin("division-director");
    apiRequest({ url: `/agreements/${AGREEMENT_ID}/contract-modifications/` }).then((response) => {
        const request = response.body.data.find((candidate) => candidate.status === "IN_REVIEW");
        expect(request, "a contract modification in review").to.exist;
        apiRequest({
            method: "PATCH",
            url: `/contract-modification-requests/${request.id}/`,
            body: { action: "APPROVE", reviewer_notes: null }
        })
            .its("status")
            .should("eq", 200);
    });
};

describe("Start a Contract Modification", () => {
    let budgetLineId;

    before(function () {
        // The flow is behind ENABLE_MODIFIED_LOE_EDITS, which is off in CI's E2E stack today.
        testLogin("system-owner");
        apiRequest({ url: "/version/" }).then((response) => {
            if (!response.body.enable_modified_loe_edits) {
                this.skip();
            }
        });
    });

    beforeEach(() => {
        declineOpenContractModifications();
        testLogin("system-owner");
        apiRequest({
            method: "POST",
            url: "/budget-line-items/",
            body: {
                agreement_id: AGREEMENT_ID,
                services_component_id: SERVICES_COMPONENT_ID,
                can_id: CAN_ID,
                line_description: "E2E contract modification",
                amount: 1000,
                status: "PLANNED",
                date_needed: new Date().toISOString().slice(0, 10),
                proc_shop_fee_percentage: 0
            }
        }).then((response) => {
            expect(response.status).to.eq(201);
            budgetLineId = response.body.id;
        });
    });

    afterEach(() => {
        declineOpenContractModifications();
        testLogin("system-owner");
        apiRequest({ method: "DELETE", url: `/budget-line-items/${budgetLineId}` });
    });

    it("sends a Planned budget line to approval and shows the modification as In Review", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.get('[data-cy="start-modification-btn"]').should("be.enabled").click();

        cy.url().should("include", `/agreements/${AGREEMENT_ID}/start-modification`);
        cy.contains("h1", "Start Modification").should("be.visible");

        // Obligated budget lines can't be selected; the Planned one can.
        cy.contains("tr", "Obligated").find('input[type="checkbox"]').should("be.disabled");
        cy.contains("tr", String(budgetLineId)).find("label").first().click();
        cy.get('[data-cy="mod-review-changes"]').should("contain", "Executing");

        cy.get("textarea[name='submitter-notes']").type("E2E contract modification");
        cy.get('[data-cy="send-to-approval-btn"]').should("be.enabled").click();

        cy.url().should("include", `/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.contains("Contract Modification Sent to Approval").should("be.visible");
        cy.contains("h2", "Contract Modification In Review").should("be.visible");
        cy.get('[data-cy="start-modification-btn"]').should("be.disabled");

        // At 200% zoom on a 1280px screen (640 CSS px) the edit cards must still fit, and the From/To
        // values must stay on one line rather than being squeezed under the In Review tag.
        cy.viewport(640, 800);
        // The heading and the cards come from different queries, so wait until every card has
        // refetched and shows In Review before measuring.
        cy.get('[data-cy="contract-modification-edit-card"]')
            .its("length")
            .then((cardCount) => {
                cy.get('[data-cy="contract-modification-edit-in-review"]').should("have.length", cardCount);
            });
        cy.get('[data-cy="contract-modification-edit-card"]').each(($card) => {
            const card = $card[0];
            expect(card.scrollWidth, "card has no horizontal overflow").to.be.at.most(card.clientWidth);
            card.querySelectorAll("dl").forEach((term) => {
                const label = term.querySelector("dt")?.textContent;
                if (label !== "From" && label !== "To") return;
                // The value tag is inline-block, so a wrapped value shows up as a taller box (one line
                // is 20px, two are 34px).
                term.querySelectorAll("dd > span").forEach((value) => {
                    expect(
                        value.getBoundingClientRect().height,
                        `${label} "${value.textContent}" doesn't wrap`
                    ).to.be.below(28);
                });
            });
        });
    });

    it("executes the budget line when the Division Director approves it", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.get('[data-cy="start-modification-btn"]').should("be.enabled").click();
        cy.contains("tr", String(budgetLineId)).find("label").first().click();
        cy.get("textarea[name='submitter-notes']").type("E2E contract modification");
        cy.get('[data-cy="send-to-approval-btn"]').should("be.enabled").click();
        cy.contains("Contract Modification Sent to Approval").should("be.visible");

        approveOpenContractModification();

        // The Division Director's review card isn't shown on the tab; everyone sees the outcome.
        cy.visit(`/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.contains("Contract Modification Pending Your Review").should("not.exist");
        cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
        cy.contains("tr", String(budgetLineId)).should("contain", "Executing");
    });
});

describe("Start a Contract Modification for a COR change (#3269)", () => {
    // Seeded users to change 523's COR to; the test uses one that isn't its COR or Alternate COR.
    const CANDIDATE_COR_IDS = [512, 513, 514];

    const patchAgreement = (body) =>
        apiRequest({ method: "PATCH", url: `/agreements/${AGREEMENT_ID}`, body })
            .its("status")
            .should("eq", 200);

    /**
     * Leave 523 with no COR change waiting for a contract modification. A COR change applies on
     * save and is tracked as one card; changing back to the card's From (the COR on the contract)
     * removes it (OPS-3153, #3269). An approved change can't be undone this way (the new COR is
     * then on the contract), so the COR may differ between runs.
     */
    const clearPendingCorChange = () => {
        declineOpenContractModifications();
        testLogin("system-owner");
        apiRequest({ url: `/agreements/${AGREEMENT_ID}/contract-modification-edits/` }).then((response) => {
            const pending = response.body.data.find((edit) => edit.field === "project_officer_id");
            if (pending) {
                patchAgreement({ project_officer_id: pending.old_value });
            }
        });
    };

    before(function () {
        testLogin("system-owner");
        apiRequest({ url: "/version/" }).then((response) => {
            if (!response.body.enable_modified_loe_edits) {
                this.skip();
            }
        });
    });

    beforeEach(() => {
        clearPendingCorChange();
    });

    afterEach(() => {
        clearPendingCorChange();
    });

    it("sends only a COR change to approval and locks the COR while it's in review", () => {
        testLogin("system-owner");
        apiRequest({ url: `/agreements/${AGREEMENT_ID}` }).then((response) => {
            const { project_officer_id: cor, alternate_project_officer_id: alternate } = response.body;
            cy.wrap(CANDIDATE_COR_IDS.find((id) => id !== cor && id !== alternate)).as("newCorId");
        });
        cy.get("@newCorId").then((newCorId) => {
            patchAgreement({ project_officer_id: newCorId });
            // The change applies on save; the card only tracks that the contract needs a modification.
            apiRequest({ url: `/agreements/${AGREEMENT_ID}` })
                .its("body.project_officer_id")
                .should("eq", newCorId);
        });

        cy.visit(`/agreements/${AGREEMENT_ID}/start-modification`);
        cy.get('[data-cy="mod-review-changes"]').should("contain", "Admin Change").and("contain", "COR");
        // No budget lines selected: the COR change alone is enough to send.
        cy.get('[data-cy="send-to-approval-btn"]').should("be.enabled").click();
        cy.contains("Contract Modification Sent to Approval").should("be.visible");
        cy.contains('[data-cy="contract-modification-edit-card"]', "Admin Change")
            .find('[data-cy="contract-modification-edit-in-review"]')
            .should("be.visible");

        // While it's in review the COR can't be changed; the Alternate COR still can.
        cy.visit(`/agreements/${AGREEMENT_ID}`);
        cy.get("#edit").click();
        cy.get('[data-cy="project-officer-locked-message"]').should("contain", "in review");
        cy.get("#project-officer-combobox-input").should("be.disabled");

        // The Division Director sees the In Review alert, not the placeholder review card.
        testLogin("division-director");
        cy.visit(`/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.contains("h2", "Contract Modification In Review").should("be.visible");
        cy.contains("Contract Modification Pending Your Review").should("not.exist");
        approveOpenContractModification();

        // Approval doesn't change the COR again.
        cy.get("@newCorId").then((newCorId) => {
            apiRequest({ url: `/agreements/${AGREEMENT_ID}` })
                .its("body.project_officer_id")
                .should("eq", newCorId);
        });
    });
});
