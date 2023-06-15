/// <reference types="Cypress"/>

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
    cy.get('#continue').click();
    cy.get("#agreement_title").clear();
    cy.get("#agreement_title").blur();
    cy.get('#input-error-message').should("contain","This is required information");
    cy.get('#continue').should("be.disabled");
    // add id or data-cy to the save draft button
    cy.get('.usa-button--outline').should("be.disabled");
    cy.get("#agreement_title").type("Test Edit Title");
    cy.get('#input-error-message').should("not.exist");
    cy.get('#continue').should("not.be.disabled");
    cy.get('.usa-button--outline').should("not.be.disabled");
    cy.get('#agreement-description').type(" more text");
    cy.get('#with-hint-textarea').type("test edit notes");

    cy.get('#continue').click()

    cy.wait("@patchAgreement")
        .then((interception) => {
            const { statusCode, body } = interception.response;
            expect(statusCode).to.equal(200);
            expect(body.message).to.equal("Agreement updated");
        })
        .then(cy.log);

    cy.get("h1").should("have.text", "Edit Agreement");
    cy.get("h2").first().should("have.text", "Budget Line Details");

    cy.get('[data-cy="step-two-continue"]').click()
    cy.get("h1").should("have.text", "Agreement draft saved");
});

