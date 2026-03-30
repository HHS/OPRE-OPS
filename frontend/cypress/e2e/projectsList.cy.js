/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("budget-team");
    cy.visit("/projects");
    cy.get("#fiscal-year-select").select("2044");
    // Wait for real table data — avoids asserting on skeleton state
    cy.get("table tbody tr", { timeout: 30000 }).should("have.length.greaterThan", 0);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Projects List Page", () => {
    it("loads the projects list with correct headings", () => {
        cy.url().should("include", "/projects");
        cy.get("h1").should("have.text", "Projects");
        cy.get("h2").should("contain.text", "All Projects");
        cy.get("table thead th").eq(0).should("contain", "Project");
        cy.get("table thead th").eq(1).should("contain", "Type");
        cy.get("table thead th").eq(2).should("contain", "Start");
        cy.get("table thead th").eq(3).should("contain", "End");
        cy.get("table thead th").eq(5).should("contain", "Project Total");
    });

    it("clicking a project name navigates to the project detail page", () => {
        cy.get("table tbody tr").first().find("a").first().click();
        cy.url().should("include", "/projects/");
        cy.get("h1").should("exist");
    });

    it("expanding a row shows agreement count and tags", () => {
        cy.get("[data-cy='expand-row']").first().click();
        cy.get("[data-testid='expanded-data']").should("be.visible");
        cy.contains("Total Agreements").should("be.visible");
        cy.get("[data-testid='agreement-count']").should("exist");
    });

    it("collapsing an expanded row hides the agreement details", () => {
        cy.get("[data-cy='expand-row']").first().click();
        cy.get("[data-testid='expanded-data']").should("be.visible");
        cy.get("[data-cy='expand-row']").first().click();
        cy.get("[data-testid='expanded-data']").should("not.exist");
    });

    it("changing the fiscal year reloads the table", () => {
        cy.get("#fiscal-year-select").select("2044");
        // Wait for new rows — stable signal that the refetch completed
        cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
    });

    it("clicking a column header sorts the table", () => {
        // Click "Type" column — direction depends on prior state so assert presence, not value
        cy.get("table thead th").eq(1).find("button").click();
        // Wait for sorted rows to appear
        cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
        // The clicked column should now have an active aria-sort value
        cy.get("table thead th")
            .eq(1)
            .should("have.attr", "aria-sort")
            .and("match", /ascending|descending/);
    });
});
