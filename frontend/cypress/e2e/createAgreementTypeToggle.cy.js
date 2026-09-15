/// <reference types="cypress" />

// Regression coverage for issue #6230: toggling Agreement Type in the Create Agreement
// wizard must not leave Service Requirement Type (or stale Services Components) in an
// invalid state that only surfaces as a bare, off-design-system message on step 3.

import { terminalLog, testLogin } from "./utils";

const OUT_OF_PLACE_MESSAGE = "Please add a Service Requirement Type to the Agreement.";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/agreements/create");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("restores the Non-Severable default after GRANT -> CONTRACT (issue #6230 repro 1)", () => {
    // Step One - Select a Project
    cy.get("#project-combobox-input").type("Human Services Interoperability Support{enter}");
    cy.get("#continue").click();

    // Step Two - select GRANT, fill only the title, and continue to step three
    cy.selectAndWaitForChange("#agreement-type-filter", "GRANT");
    cy.get("#name").type("E2E Type Toggle Test");
    cy.get("[data-cy='continue-btn']").should("not.be.disabled").click();

    // Step Three (as GRANT) - go back to step two without adding anything
    cy.get('[data-cy="back-button"]').click();

    // Switch the type back to CONTRACT
    cy.selectAndWaitForChange("#agreement-type-filter", "CONTRACT");

    // The default must be restored, not left blank from the GRANT transition
    cy.get("#service_requirement_type").should("contain", "Non-Severable");
    cy.get(".usa-error-message").should("not.exist");

    cy.get("[data-cy='continue-btn']").should("not.be.disabled").click();

    // Step Three (as CONTRACT) - must show the normal empty state, not the fallback message
    cy.contains(OUT_OF_PLACE_MESSAGE).should("not.exist");
    cy.get("p").should("contain", "You have not added any Services Component yet.");
});

it("clears a stale Services Component after a CONTRACT -> GRANT -> CONTRACT round trip (issue #6230 repro 2)", () => {
    // Step One - Select a Project
    cy.get("#project-combobox-input").type("Human Services Interoperability Support{enter}");
    cy.get("#continue").click();

    // Step Two - CONTRACT is the default type; fill only the title and continue
    cy.selectAndWaitForChange("#agreement-type-filter", "CONTRACT");
    cy.get("#name").type("E2E Type Toggle Test 2");
    cy.get("[data-cy='continue-btn']").should("not.be.disabled").click();

    // Step Three - add a Services Component
    cy.get("#servicesComponentSelect").select("1");
    cy.get("#pop-start-date").type("01/01/2024");
    cy.get("#pop-end-date").type("01/01/2045");
    cy.get("#description").type("This is a description.");
    cy.get("[data-cy='add-services-component-btn']").click();
    // Non-Severable labels components "Services Component N" ("Base Period N" is the
    // Severable-only label, per formatServiceComponent).
    cy.get("h2").should("contain", "Services Component 1");

    // Back to step two, then round-trip the type through GRANT and back to CONTRACT
    cy.get('[data-cy="back-button"]').click();
    cy.selectAndWaitForChange("#agreement-type-filter", "GRANT");
    cy.selectAndWaitForChange("#agreement-type-filter", "CONTRACT");

    cy.get("#service_requirement_type").should("contain", "Non-Severable");
    cy.get("[data-cy='continue-btn']").should("not.be.disabled").click();

    // Step Three - the stale component from before the round trip must be gone, and the
    // out-of-place fallback message must never appear
    cy.contains(OUT_OF_PLACE_MESSAGE).should("not.exist");
    cy.contains("h2", "Services Component 1").should("not.exist");
    cy.get("p").should("contain", "You have not added any Services Component yet.");
});
