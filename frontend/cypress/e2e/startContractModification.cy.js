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

        // At 200% zoom on a 1280px screen (640 CSS px) the edit cards must still fit, with no value
        // hidden under the In Review tag.
        cy.viewport(640, 800);
        cy.get('[data-cy="contract-modification-edit-card"]')
            .should("have.length.at.least", 1)
            .each(($card) => {
                const card = $card[0];
                expect(card.scrollWidth, "card has no horizontal overflow").to.be.at.most(card.clientWidth);
                const tag = card.querySelector('[data-cy="contract-modification-edit-in-review"]');
                expect(tag, "In Review tag").to.exist;
                const tagRect = tag.getBoundingClientRect();
                card.querySelectorAll("dd").forEach((value) => {
                    const rect = value.getBoundingClientRect();
                    const overlaps =
                        rect.right > tagRect.left &&
                        rect.left < tagRect.right &&
                        rect.bottom > tagRect.top &&
                        rect.top < tagRect.bottom;
                    expect(overlaps, `"${value.textContent}" is clear of the In Review tag`).to.be.false;
                });
            });
    });
});
