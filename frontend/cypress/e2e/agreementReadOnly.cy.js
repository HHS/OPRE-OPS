/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("read-only-user");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("read-only user cannot see edit or delete buttons on agreements", () => {
    it("does not show edit or delete icons on the agreements list table row", () => {
        cy.visit("/agreements");
        cy.get("#fiscal-year-select").select("All");
        cy.get("tbody tr", { timeout: 10000 }).should("exist");
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').should("not.exist");
        cy.get("tbody").find("tr").first().find('[data-cy="delete-row"]').should("not.exist");
    });

    it("does not show edit or delete icons in the expanded agreement table row", () => {
        cy.visit("/agreements");
        cy.get("#fiscal-year-select").select("All");
        cy.get("tbody tr", { timeout: 10000 }).should("exist");
        cy.get("tbody").find("tr").first().find('[data-cy="expand-row"]').click();
        cy.get('[data-cy="change-icons-expanded"]').should("not.exist");
    });

    it("does not show the Edit button on the Agreement Details page", () => {
        cy.visit("/agreements/1");
        cy.get("h1", { timeout: 10000 }).should("be.visible");
        cy.get("#edit").should("not.exist");
    });

    it("does not show the Edit button on the Agreement Budget Lines page", () => {
        cy.visit("/agreements/1/budget-lines");
        cy.get("h2", { timeout: 10000 }).contains("Budget Lines Summary").should("be.visible");
        cy.get("#edit").should("not.exist");
    });

    it("does not show the Request BL Status Change button on the Agreement Budget Lines page", () => {
        cy.visit("/agreements/1/budget-lines");
        cy.get("h2", { timeout: 10000 }).contains("Budget Lines Summary").should("be.visible");
        cy.get('[data-cy="bli-continue-btn"]').should("not.exist");
        cy.get('[data-cy="bli-continue-btn-disabled"]').should("not.exist");
    });
});
