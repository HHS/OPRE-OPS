/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("CAN detail page", () => {
    it("shows relevant CAN data", () => {
        cy.visit("/cans/502/");
        cy.get("h1").should("contain", "G99PHS9"); // heading
        cy.get("p").should("contain", "SSRD - 5 Years"); // sub-heading
        cy.get("span").should("contain", "Nicole Deterding"); // team member
        cy.get("span").should("contain", "Director Derrek"); // division director
        cy.get("span").should("contain", "Program Support"); // portfolio
    });
    it("shows the CAN Spending page", () => {
        cy.visit("/cans/504/spending");
        cy.get("#fiscal-year-select").select("2043");
        cy.get("h1").should("contain", "G994426"); // heading
        cy.get("p").should("contain", "HS - 5 Years"); // sub-heading
        // should contain the budget line table
        cy.get("table").should("exist");
        // table should have more than 1 row
        cy.get("tbody").children().should("have.length.greaterThan", 1);
        cy.get("#big-budget-summary-card").should("exist");
        cy.get("#big-budget-summary-card").should("contain", "-$ 3,000,000.00");
        cy.get("#project-agreement-bli-card").should("exist");
        cy.get("span").should("contain", "3 Draft");
        cy.get("span").should("contain", "1 Executing");
        cy.get("span").should("contain", "1 Planned");
        cy.get("#donut-graph-with-legend-card").should("exist");
        // switch to a different fiscal year
        cy.get("#fiscal-year-select").select("2022");
        // table should not exist
        cy.get("tbody").should("not.exist");
        cy.get("p").should("contain", "No budget lines have been added to this CAN.");
    });
});
