/* eslint-disable no-undef */

it("loads", () => {
    cy.visit("/portfolios");

    cy.get("caption").should("have.text", "List of all Portfolios");
    cy.get('a[href="/portfolios/1"]').should("exist");
});

it("passes a11y checks", () => {
    cy.visit("/portfolios");
    cy.injectAxe();

    cy.checkA11y();
});

it("clicking on a Portfolio takes you to the detail page", () => {
    cy.visit("/portfolios");

    const portfolioName = "SuperAwesome Portfolio";

    cy.contains(portfolioName).click();

    cy.url().should("include", "/portfolios/1");
    cy.get("h1").should("contain", portfolioName);
});
