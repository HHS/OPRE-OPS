/* eslint-disable no-undef */

it("loads", () => {
    cy.visit("/portfolios/1");

    cy.get("h1").should("contain", "SuperAwesome Portfolio");
});

it("passes a11y checks", () => {
    cy.visit("/portfolios/1");
    cy.injectAxe();

    cy.checkA11y();
});

it("goes to the CAN detail page after clicking on it", () => {
    cy.visit("/portfolios/1");

    const canNumber = "G99PHS9";

    cy.contains(canNumber).click();

    cy.url().should("include", "/cans/3");
    cy.get("h1").should("contain", canNumber);
});
