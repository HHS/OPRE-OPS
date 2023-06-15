/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    // TODO: create new agreement for testing the edit
    cy.visit("/agreements/edit/1");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("edit an agreement", () => {
    cy.intercept("PATCH", "**/agreements/**").as("patchAgreement");
    cy.get("h1").should("have.text", "Edit Agreement");
    cy.get("#continue").click();
    // test validation
    cy.get("#agreement_title").clear();
    cy.get("#agreement_title").blur();
    cy.get("#input-error-message").should("contain", "This is required information");
    cy.get("[data-cy='continue-btn']").should("be.disabled");
    cy.get("[data-cy='save-draft-btn']").should("be.disabled");
    cy.get("#agreement_title").type("Test Edit Title");
    cy.get("#input-error-message").should("not.exist");
    cy.get("[data-cy='continue-btn']").should("not.be.disabled");
    cy.get("[data-cy='save-draft-btn']").should("not.be.disabled");
    cy.get("#agreement-description").type(" more text");
    cy.get("#with-hint-textarea").type("test edit notes");

    cy.get("[data-cy='continue-btn']").click();

    cy.wait("@patchAgreement")
        .then((interception) => {
            const { statusCode, body } = interception.response;
            expect(statusCode).to.equal(200);
            expect(body.message).to.equal("Agreement updated");
        })
        .then(cy.log);

    cy.get("h1").should("have.text", "Edit Agreement");
    cy.get("h2").first().should("have.text", "Budget Line Details");

    cy.get('[data-cy="continue-btn"]').click();
    cy.get("h1").should("have.text", "Agreement draft saved");
});
