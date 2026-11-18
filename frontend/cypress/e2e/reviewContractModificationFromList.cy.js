/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

// Reuses the same seeded Awarded contract as startContractModification.cy.js (OPS-3072
// manual-testing fixture): an Awarded Contract with Obligated budget lines. Its seeded Planned
// budget line is in a future FY, so this spec adds its own current-FY one to execute.
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

describe("Review a Contract Modification from the For Review list (#6546)", () => {
    let budgetLineId;

    before(function () {
        // Behind ENABLE_MODIFIED_LOE_EDITS, which is off in CI's E2E stack today.
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
                line_description: "E2E mod approval from list",
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
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
        declineOpenContractModifications();
        testLogin("system-owner");
        apiRequest({ method: "DELETE", url: `/budget-line-items/${budgetLineId}` });
    });

    it("approves from the quick icons on the For Review list, with no Review agreement link", () => {
        // Submit the modification via the API -- the UI submission flow is already covered by
        // startContractModification.cy.js; this spec is about the review side.
        testLogin("system-owner");
        apiRequest({
            method: "POST",
            url: `/agreements/${AGREEMENT_ID}/contract-modifications/`,
            body: { budget_line_item_ids: [budgetLineId], requestor_notes: "E2E mod approval from list" }
        }).its("status").should("eq", 201);

        testLogin("division-director");
        cy.visit("/agreements?filter=change-requests").wait(1000);

        cy.get('[data-cy="contract-modification-review-card"]').should("exist").as("modCard");
        cy.get("@modCard").contains("Contract Modification");
        cy.get("@modCard").contains("As-Is");
        // No "Review agreement" link or detail view -- the icons are the only interaction (#6546).
        cy.get("@modCard").contains(/review agreement/i).should("not.exist");

        cy.get("@modCard").find('[data-cy="approve-contract-modification-icon-btn"]').click();
        cy.get(".usa-modal__content").should("exist");
        cy.get(".usa-modal__content").contains("Are you sure you want to approve this Contract Modification?");
        cy.get("[data-cy='confirm-action']").click();

        cy.get(".usa-alert__body").contains(/contract modification approved/i);
        cy.get('[data-cy="contract-modification-review-card"]').should("not.exist");

        // The requester sees the existing outcome alert on the agreement (no-regression check).
        testLogin("system-owner");
        cy.visit(`/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.contains("Contract Modification Approved").should("be.visible");
    });

    it("declines from the quick icons on the For Review list", () => {
        testLogin("system-owner");
        apiRequest({
            method: "POST",
            url: `/agreements/${AGREEMENT_ID}/contract-modifications/`,
            body: { budget_line_item_ids: [budgetLineId], requestor_notes: "E2E mod decline from list" }
        }).its("status").should("eq", 201);

        testLogin("division-director");
        cy.visit("/agreements?filter=change-requests").wait(1000);

        cy.get('[data-cy="contract-modification-review-card"]').should("exist").as("modCard");
        cy.get("@modCard").find('[data-cy="decline-contract-modification-icon-btn"]').click();
        cy.get(".usa-modal__content").should("exist");
        cy.get(".usa-modal__content").contains("Are you sure you want to decline this Contract Modification?");
        cy.get("[data-cy='confirm-action']").click();

        cy.get(".usa-alert__body").contains(/contract modification declined/i);
        cy.get('[data-cy="contract-modification-review-card"]').should("not.exist");

        testLogin("system-owner");
        cy.visit(`/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.contains("Contract Modification Declined").should("be.visible");
    });
});
