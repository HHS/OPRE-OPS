/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

// Edit-an-EXISTING-grant coverage (complements createGrantAgreement.cy.js, which only
// covers the create wizard). Each test seeds a persisted grant (agreement + grant number
// + grant BLI) via the API, then drives the edit surfaces in the UI.

const API = "http://localhost:8080/api/v1";

const bearer = () => `Bearer ${window.localStorage.getItem("access_token")}`;

/**
 * Create a grant agreement with one grant number and one grant budget line via the API.
 * Returns the created ids through the yielded object.
 */
const seedGrant = (nameSuffix) => {
    const grantPayload = {
        agreement_type: "GRANT",
        name: `E2E Edit Grant ${nameSuffix}`,
        description: "Seeded grant for edit E2E",
        project_id: 1000,
        project_officer_id: 500,
        nofo_number: "NOFO-ORIGINAL",
        aln_numbers: ["93.086"],
        funding_period_months: 12,
        team_members: [{ id: 502 }, { id: 504 }],
        grant_numbers: [{ number: 1, description: "Seeded grant number", ref: "gn-1" }]
    };

    return cy
        .request({
            method: "POST",
            url: `${API}/agreements/`,
            body: grantPayload,
            headers: { Authorization: bearer(), "Content-Type": "application/json", Accept: "application/json" }
        })
        .then((agreementResp) => {
            expect(agreementResp.status).to.eq(201);
            const agreementId = agreementResp.body.id;

            // The create response only returns { message, id, ... } — it does not echo the
            // persisted grant_numbers. GET the agreement to read the generated grant number id.
            return cy
                .request({
                    method: "GET",
                    url: `${API}/agreements/${agreementId}`,
                    headers: { Authorization: bearer(), Accept: "application/json" }
                })
                .then((getResp) => {
                    expect(getResp.status).to.eq(200);
                    const grantNumberId = getResp.body.grant_numbers[0].id;

                    return cy
                        .request({
                            method: "POST",
                            url: `${API}/budget-line-items/`,
                            body: {
                                agreement_id: agreementId,
                                grant_number_id: grantNumberId,
                                line_description: "Seeded grant BLI",
                                can_id: 500,
                                amount: 100000,
                                date_needed: "2044-01-01",
                                status: "DRAFT"
                            },
                            headers: {
                                Authorization: bearer(),
                                "Content-Type": "application/json",
                                Accept: "application/json"
                            }
                        })
                        .then((bliResp) => {
                            expect(bliResp.status).to.eq(201);
                            return { agreementId, grantNumberId, bliId: bliResp.body.id };
                        });
                });
        });
};

const deleteAgreement = (agreementId) => {
    cy.request({
        method: "DELETE",
        url: `${API}/agreements/${agreementId}`,
        headers: { Authorization: bearer(), Accept: "application/json" },
        failOnStatusCode: false
    });
};

describe("edit an existing Grant agreement", () => {
    beforeEach(() => {
        testLogin("system-owner");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("deleting a grant number moves its BLI to the not-associated group", () => {
        expect(localStorage.getItem("access_token")).to.exist;

        seedGrant(Date.now()).then(({ agreementId }) => {
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            // Gate on the read-only accordion so grant_numbers are loaded before edit mode mounts.
            cy.contains(".usa-accordion__heading", "Grant 1").should("be.visible");
            cy.get("#edit").click();

            // Verify the BLI starts under the "Grant 1" accordion.
            cy.contains(".usa-accordion__heading", "Grant 1").should("be.visible");

            // Delete the grant number.
            cy.get("[data-cy='grant-number-list'] > :nth-child(1)").trigger("mouseover");
            cy.get("[data-cy='grant-number-list'] > :nth-child(1)").within(() => {
                cy.get("[data-cy='grant-number-item-delete-button']").should("be.visible").click();
            });
            // Confirm deletion in the modal.
            cy.get("[data-cy='confirm-action']").click();

            // The "Grant 1" accordion must be gone; the BLI must appear under "not associated".
            cy.contains(".usa-accordion__heading", "Grant 1").should("not.exist");
            cy.contains(".usa-accordion__heading", /not associated/i).should("be.visible");

            cy.get("[data-cy='continue-btn']").click();
            cy.get(".usa-alert__heading").should("contain", "Agreement Updated");

            deleteAgreement(agreementId);
        });
    });

    it("edits grant metadata, a grant number, and a budget line", () => {
        expect(localStorage.getItem("access_token")).to.exist;

        seedGrant(Date.now()).then(({ agreementId }) => {
            // ---- 1. Edit grant metadata (Grant Details) ----
            cy.intercept("PATCH", "**/agreements/**").as("patchAgreement");
            cy.visit(`/agreements/${agreementId}`);
            cy.get("#edit").click();

            cy.get("#nofo_number").should("have.value", "NOFO-ORIGINAL");
            cy.get("#nofo_number").clear();
            cy.get("#nofo_number").type("NOFO-UPDATED");

            cy.get("[data-cy='continue-btn']").click();
            cy.wait("@patchAgreement").then((interception) => {
                expect(interception.response.statusCode).to.eq(200);
                expect(interception.request.body).to.include({ nofo_number: "NOFO-UPDATED" });
            });
            cy.get(".usa-alert__body").should("contain", "has been successfully updated");

            // ---- 2. Edit a grant number ----
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            // Wait for the grant-numbers query to resolve BEFORE entering edit mode. The editor
            // context snapshots grant_numbers into its reducer only at mount and never backfills
            // from the prop, so clicking #edit too early mounts an empty list that stays empty
            // ("You have not added any Grants Numbers yet."). The read-only "Grant 1" accordion
            // only renders once the query has loaded, making it a safe gate.
            cy.contains(".usa-accordion__heading", "Grant 1").should("be.visible");
            cy.get("#edit").click();
            cy.get("[data-cy='grant-number-list'] > :nth-child(1)").trigger("mouseover");
            cy.get("[data-cy='grant-number-list'] > :nth-child(1)").within(() => {
                cy.get("[data-cy='grant-number-item-edit-button']").should("be.visible").click();
            });
            cy.get("#description").clear();
            cy.get("#description").type("Edited grant number description");
            cy.get("[data-cy='update-grant-number-btn']").click();
            cy.get("[data-cy='continue-btn']").click();
            cy.get(".usa-alert__heading").should("contain", "Agreement Updated");

            // ---- 3. Edit a budget line ----
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("#edit").click();
            cy.waitForEditingState(true);

            let budgetLineId;
            cy.get('[data-testid^="budget-line-row-"]')
                .first()
                .invoke("attr", "data-testid")
                .then((testId) => {
                    budgetLineId = testId.split("row-")[1];
                });

            cy.then(() => {
                cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).trigger("mouseover");
                cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).find("[data-cy='edit-row']").click();
                cy.get("#enteredAmount").clear();
                cy.get("#enteredAmount").type("250000");
                cy.get("[data-cy='update-budget-line']").click();
                cy.get(".usa-alert__text").should("contain", `Budget line ${budgetLineId} was updated`);
                cy.get("[data-cy='continue-btn']").click();
                cy.get(".usa-alert__heading").should("contain", "Agreement Updated");

                deleteAgreement(agreementId);
            });
        });
    });
});

describe("unauthorized user cannot edit a Grant agreement", () => {
    let seededAgreementId;

    before(() => {
        testLogin("system-owner");
        // Defer seeding into cy.then so it runs AFTER testLogin's queued commands complete.
        // bearer() reads localStorage synchronously at command-queue time; without this the
        // token isn't set yet and the seed request sends "Bearer null" (422).
        cy.then(() => {
            seedGrant(`unauth-${Date.now()}`).then(({ agreementId }) => {
                seededAgreementId = agreementId;
            });
        });
    });

    after(() => {
        testLogin("system-owner");
        cy.then(() => deleteAgreement(seededAgreementId));
    });

    beforeEach(() => {
        testLogin("basic");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("hides the edit control on the grant detail page", () => {
        cy.then(() => {
            cy.visit(`/agreements/${seededAgreementId}`);
            cy.get("h1", { timeout: 10000 }).should("be.visible");
            cy.get("#edit").should("not.exist");
        });
    });

    it("shows an error when hacking the edit URL directly", () => {
        cy.then(() => {
            cy.visit(`/agreements/edit/${seededAgreementId}`);
            cy.get(".usa-alert__body").should("exist");
            cy.get(".usa-alert__body").contains("This Agreement cannot be edited");
        });
    });
});
