/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

before(() => {
    testLogin("admin");
    cy.visit("/budget-lines/create");
});

// afterEach(() => {
//     cy.injectAxe();
//     cy.checkA11y(null, null, terminalLog);
// });

describe("create budget lines workflow", () => {
    it("should complete step one", () => {
        // step one should say "Project & Agreement"
        cy.get(".usa-step-indicator__segment--current").should("contain", "Project & Agreement");
        // summary cards should not exist
        cy.get('[data-cy="project-summary-card"]').should("not.exist");
        cy.get('[data-cy="agreement-summary-card"]').should("not.exist");
        // continue button should be disabled
        cy.get('[data-cy="continue-button-step-one"]').should("be.disabled");
        // agreement should be disabled until project is selected
        cy.get("#agreement").should("be.disabled");
        // select project
        cy.get("#project").type("Human Services Interoperability Support{enter}");
        // summary card should exist after project is selected
        cy.get('[data-cy="project-summary-card"]').should("exist");
        // agreement should be enabled after project is selected
        cy.get("#agreement").should("not.be.disabled");
        cy.get("#agreement").select(1);
        cy.get('[data-cy="agreement-summary-card"]').should("exist");
        cy.get('[data-cy="continue-button-step-one"]').as("continue-btn").should("not.disabled");
        cy.get("@continue-btn").click();
    });
});
