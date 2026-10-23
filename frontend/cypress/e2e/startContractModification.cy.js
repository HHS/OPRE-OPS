/// <reference types="cypress" />

import { testLogin } from "./utils";

// Seeded Awarded contract with three Obligated budget lines and one Planned budget line in the
// current fiscal year (OPS-3072 / #3268 manual-testing fixture).
const AGREEMENT_ID = 523;
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

describe("Start a Contract Modification", () => {
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
    });

    afterEach(() => {
        declineOpenContractModifications();
    });

    it("sends a Planned budget line to approval and shows the modification as In Review", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.get('[data-cy="start-modification-btn"]').should("be.enabled").click();

        cy.url().should("include", `/agreements/${AGREEMENT_ID}/start-modification`);
        cy.contains("h1", "Start Modification").should("be.visible");

        // Obligated budget lines can't be selected; the Planned one can.
        cy.contains("tr", "Obligated").find('input[type="checkbox"]').should("be.disabled");
        cy.contains("tr", "Planned").find("label").first().click();
        cy.get('[data-cy="mod-review-changes"]').should("contain", "Executing");

        cy.get("textarea[name='submitter-notes']").type("E2E contract modification");
        cy.get('[data-cy="send-to-approval-btn"]').should("be.enabled").click();

        cy.url().should("include", `/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.contains("Contract Modification Sent to Approval").should("be.visible");
        cy.contains("h2", "Contract Modification In Review").should("be.visible");
        cy.get('[data-cy="start-modification-btn"]').should("be.disabled");
    });
});
