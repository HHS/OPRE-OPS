/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/agreements/create");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("can create a Grant agreement", () => {
    cy.intercept("POST", "**/agreements").as("postAgreement");

    // Step One - Select a Project
    cy.get("#project-combobox-input").type("Human Services Interoperability Support{enter}");
    cy.get("#continue").click();

    // Step Two - Create Agreement
    cy.get("[data-cy='agreement-type']").should("not.exist");
    cy.get("[data-cy='save-draft-btn']").should("be.disabled");

    // Select Grant type
    cy.get("#agreement-type-filter").select("GRANT");

    // Contract-only controls should not be visible
    cy.get("#contract-type").should("not.exist");
    cy.get("#service_requirement_type").should("not.exist");
    cy.get("#product_service_code_id").should("not.exist");
    cy.get("#agreement_reason").should("not.exist");
    cy.get("#project-officer-combobox-input").should("not.exist");

    // Continue button should not be visible for grants in wizard mode
    cy.get("[data-cy='continue-btn']").should("not.exist");

    // Save Draft should still be disabled (no title yet)
    cy.get("[data-cy='save-draft-btn']").should("be.disabled");

    // Enter required grant fields
    cy.get("#name").type("E2E Grant Agreement Test");
    cy.get("#nickname").type("GRANT-TEST");
    cy.get("#description").type("This is a test grant agreement description.");

    // Save Draft should now be enabled
    cy.get("[data-cy='save-draft-btn']").should("not.be.disabled");

    // Save the draft
    cy.get("[data-cy='save-draft-btn']").click();
    cy.wait("@postAgreement").its("response.statusCode").should("eq", 201);

    // Should show success alert and redirect to /agreements
    cy.get("[data-cy='alert']").should("contain", "Agreement Draft Saved");
    cy.url().should("include", "/agreements");
});
