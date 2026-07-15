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

    // Grant Details fields should be visible
    cy.get("#nofo_number").should("exist");
    cy.get("#funding_period_months").should("exist");
    cy.get("#aln_number").should("exist");
    // The FPO combobox now renders for grants (reuses ProjectOfficerComboBox)
    cy.get("#project-officer-combobox-input").should("exist");

    // Continue button should not be visible for grants in wizard mode
    cy.get("[data-cy='continue-btn']").should("not.exist");

    // Save Draft should still be disabled (no title yet)
    cy.get("[data-cy='save-draft-btn']").should("be.disabled");

    // Enter Title/Nickname/Description (from #5925) — Save Draft still disabled without NOFO Number
    cy.get("#name").type("E2E Grant Agreement Test");
    cy.get("#nick_name").type("GRANT-TEST");
    cy.get("#description").type("This is a test grant agreement description.");
    cy.get("[data-cy='save-draft-btn']").should("be.disabled");

    // NOFO Number is now required to enable Save Draft
    cy.get("#nofo_number").type("NOFO-2026-01");

    // Optionally fill the remaining Grant Details fields
    cy.get("#funding_period_months").type("18");
    cy.get("#aln_number").type("93.600");

    // Save Draft should now be enabled once NOFO Number is present
    cy.get("[data-cy='save-draft-btn']").should("not.be.disabled");

    // Save the draft
    cy.get("[data-cy='save-draft-btn']").click();
    cy.wait("@postAgreement").its("response.statusCode").should("eq", 201);

    // Should show success alert and redirect to /agreements
    cy.get("[data-cy='alert']").should("contain", "Agreement Draft Saved");
    cy.url().should("include", "/agreements");
});
