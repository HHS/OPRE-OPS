/* eslint-disable no-undef */

it("loads", () => {
    cy.visit("/");

    cy.get("h1").should("have.text", "This is the OPRE OPS system prototype.");
});

it("passes a11y checks", () => {
    cy.visit("/");
    cy.injectAxe();

    cy.checkA11y();
});

it("clicking on /cans nav takes you to CAN page", () => {
    cy.visit("/");

    cy.contains("/cans").click();

    cy.url().should("include", "/cans");
    cy.get("h1").should("have.text", "CANs");
});

it("clicking on /portfolio nav takes you to Portfolio page", () => {
    cy.visit("/");

    cy.contains("/portfolio").click();

    cy.url().should("include", "/portfolios");
    cy.get("caption").should("have.text", "List of all Portfolios");
});
