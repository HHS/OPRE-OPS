/* eslint-disable no-undef */

beforeEach(() => {
    cy.visit("/");
    cy.injectAxe();
});

it("loads", () => {
    cy.get("h1").should("have.text", "This is the OPRE OPS system prototype.");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});

it("clicking on /cans nav takes you to CAN page", () => {
    cy.contains("/cans").click();

    cy.url().should("include", "/cans");
    cy.get("h1").should("have.text", "CANs");
});

it("clicking on /portfolio nav takes you to Portfolio page", () => {
    cy.contains("/portfolios").click();

    cy.url().should("include", "/portfolios");
    cy.get("h1").should("have.text", "Portfolios");
});
