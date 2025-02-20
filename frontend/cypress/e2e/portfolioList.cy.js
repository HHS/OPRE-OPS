/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/portfolios");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe.skip("Portfolio List Page", () => {
    it("loads", () => {
        cy.get("h1").should("have.text", "Portfolios");
        cy.get('a[href="/portfolios/1"]').should("exist");
    });

    it("clicking on a Portfolio takes you to the detail page", () => {
        const portfolioName = "Healthy Marriage & Responsible Fatherhood";

        cy.contains(portfolioName).click();

        cy.url().should("include", "/portfolios/6/spending");
        cy.get("h1").should("contain", portfolioName);
    });
});
