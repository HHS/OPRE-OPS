/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("budget-team");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Portfolio List Page", () => {
    it("loads", () => {
        cy.visit("/portfolios");
        cy.get("h1").should("have.text", "Portfolios");
        cy.get("h2").first().should("have.text", "Division of Child and Family Development");
        cy.get('a[href="/portfolios/1/spending"]').should("exist");
    });

    it("clicking on a Portfolio takes you to the detail page", () => {
        cy.visit("/portfolios");
        const portfolioName = "Child Welfare Research";
        cy.contains(portfolioName).click();
        cy.url().should("include", "/portfolios/1/spending");
        cy.get("h1").should("have.text", portfolioName);
    });
});
