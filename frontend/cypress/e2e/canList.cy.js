/* eslint-disable no-undef */

it("loads", () => {
    cy.visit("/cans");

    cy.get("h1").should("have.text", "CANs");
    cy.get('a[href="/cans/3"]').should("exist");
});

it("passes a11y checks", () => {
    cy.visit("/cans");
    cy.injectAxe();

    cy.checkA11y();
});

it("clicking on a CAN takes you to the detail page", () => {
    cy.visit("/cans");

    const canNumber = "G99PHS9";

    cy.contains(canNumber).click();

    cy.url().should("include", "/cans/3");
    cy.get("h1").should("contain", canNumber);
});
