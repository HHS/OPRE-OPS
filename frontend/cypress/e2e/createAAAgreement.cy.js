/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

describe("Create an AA agreement", () => {
    beforeEach(() => {
        testLogin("basic");
        cy.visit("/agreements/create");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("Create minimal AA", () => {
        cy.intercept("POST", "**/agreements").as("postAgreement");

        // Step One - Select a Project
        cy.get("#project-combobox-input").type("Human Services Interoperability Support{enter}");
        cy.get("#continue").click();

        // Step Two - Fill out Agreement details
        // Select Agreement Type
        cy.get("#agreement_type").select("AA");
        cy.get(".usa-error-message").should("not.exist");
        cy.get("[data-cy='continue-btn']").should("be.disabled");
        cy.get("[data-cy='save-draft-btn']").should("be.disabled");

        // Fill in Agreement Title
        cy.get("#name").type("Test Assisted Acquisition Title");
        cy.get(".usa-error-message").should("not.exist");
        cy.get("[data-cy='continue-btn']").should("be.disabled");
        cy.get("[data-cy='save-draft-btn']").should("be.disabled");

        // Select Requesting agency
        cy.get("#requesting-agency").select(2);
        cy.get("[data-cy='continue-btn']").should("be.disabled");
        cy.get("[data-cy='save-draft-btn']").should("be.disabled");

        // Select Servicing agency
        cy.get("#requesting-agency").select(1);
        cy.get("[data-cy='continue-btn']").should("not.be.disabled");
        cy.get("[data-cy='save-draft-btn']").should("not.be.disabled");
    });
});
