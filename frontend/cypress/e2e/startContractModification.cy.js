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

    it("lets the Division Director approve it, and the Budget Lines tab shows Executing without reloading", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.get('[data-cy="start-modification-btn"]').should("be.enabled").click();
        cy.contains("tr", String(budgetLineId)).find("label").first().click();
        cy.get("textarea[name='submitter-notes']").type("E2E contract modification");
        cy.get('[data-cy="send-to-approval-btn"]').should("be.enabled").click();

        testLogin("division-director");
        cy.visit(`/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.get('[data-cy="approve-contract-modification-btn"]').click();
        cy.get(".usa-modal__content").contains(/approve this Contract Modification\?/i);
        cy.get('[data-cy="confirm-action"]').click();
        cy.contains(/Contract Modification Approved/i).should("be.visible");

        // Same mounted Agreement page, just a client-side tab switch — no reload. Regression test for
        // OPS-1008's missed "Agreements" cache invalidation (reviewContractModification was only
        // invalidating ContractModifications/BudgetLineItems/Notifications/AgreementHistory, so the
        // agreement object the Budget Lines tab reads from stayed stale).
        cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
        cy.contains("tr", String(budgetLineId)).should("contain", "Executing");
    });
});

describe("Start a Contract Modification for a COR change (#3269)", () => {
    // A seeded user who is neither 523's COR nor its Alternate COR.
    const NEW_COR_ID = 512;
    let originalCorId;
    let originalAlternateCorId;

    const patchAgreement = (body) =>
        apiRequest({ method: "PATCH", url: `/agreements/${AGREEMENT_ID}`, body })
            .its("status")
            .should("eq", 200);

    /**
     * Put 523's COR and Alternate COR back the way they were, and drop any pending COR change.
     * Changing the COR to the saved Alternate COR applies immediately (OPS-3153) and removes a
     * pending change that targets that person, so: promote the pending target (if any), promote
     * the original COR, then restore the original Alternate COR.
     */
    const restoreCor = () => {
        declineOpenContractModifications();
        testLogin("system-owner");
        apiRequest({ url: `/agreements/${AGREEMENT_ID}/contract-modification-edits/` }).then((response) => {
            const pending = response.body.data.find((edit) => edit.field === "project_officer_id");
            if (pending) {
                patchAgreement({ alternate_project_officer_id: pending.new_value });
                patchAgreement({ project_officer_id: pending.new_value });
            }
        });
        apiRequest({ url: `/agreements/${AGREEMENT_ID}` }).then((response) => {
            if (response.body.project_officer_id !== originalCorId) {
                patchAgreement({ alternate_project_officer_id: originalCorId });
                patchAgreement({ project_officer_id: originalCorId });
            }
        });
        apiRequest({ url: `/agreements/${AGREEMENT_ID}` }).then((response) => {
            if (response.body.alternate_project_officer_id !== originalAlternateCorId) {
                patchAgreement({ alternate_project_officer_id: originalAlternateCorId });
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
        apiRequest({ url: `/agreements/${AGREEMENT_ID}` }).then((response) => {
            originalCorId = response.body.project_officer_id;
            originalAlternateCorId = response.body.alternate_project_officer_id;
        });
    });

    beforeEach(() => {
        restoreCor();
    });

    afterEach(() => {
        restoreCor();
    });

    it("sends only a COR change to approval, locks the COR while in review, and applies it on approval", () => {
        testLogin("system-owner");
        patchAgreement({ project_officer_id: NEW_COR_ID });

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

        testLogin("division-director");
        cy.visit(`/agreements/${AGREEMENT_ID}/award-modifications`);
        cy.get('[data-cy="approve-contract-modification-btn"]').click();
        cy.get('[data-cy="confirm-action"]').click();
        cy.contains("The COR has been updated.").should("be.visible");

        apiRequest({ url: `/agreements/${AGREEMENT_ID}` })
            .its("body.project_officer_id")
            .should("eq", NEW_COR_ID);
        cy.get('[data-cy="details-tab-Agreement Details"]').click();
        cy.contains("Change to COR").should("be.visible");
    });
});
