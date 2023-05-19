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
        cy.get(".usa-step-indicator__segment--current").should("contain", "Project & Agreement");
        // summary card should not exist until project is selected
        cy.get('[data-cy="project-summary-card"]').should("not.exist");
        // agreement should be disabled until project is selected
        cy.get("#agreement").should("be.disabled");
        // select project
        cy.get("#project").type("Human Services Interoperability Support{enter}");
        // summary card should exist after project is selected
        cy.get('[data-cy="project-summary-card"]').should("exist");
        // agreement should be enabled after project is selected
        cy.get("#agreement").should("not.be.disabled");
        cy.get("#agreement").select(1);
    });
});
