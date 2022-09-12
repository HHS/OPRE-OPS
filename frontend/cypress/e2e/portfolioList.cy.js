/* eslint-disable no-undef */

before(() => {
    cy.visit("/portfolios");
    cy.injectAxe();
});

it("loads", () => {
    cy.get("h1").should("have.text", "Portfolios");
    cy.get('a[href="/portfolios/1"]').should("exist");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});

it("clicking on a Portfolio takes you to the detail page", () => {
    const portfolioName = "SuperAwesome Portfolio";

    cy.contains(portfolioName).click();

    cy.url().should("include", "/portfolios/1");
    cy.get("h1").should("contain", portfolioName);
});
