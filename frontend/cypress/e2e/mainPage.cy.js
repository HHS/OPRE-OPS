/// <reference types="cypress" />
beforeEach(() => {
    cy.visit("/");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y();
});

it("has expected state on initial load", () => {
    cy.fixture("initial-state").then((initState) => {
        cy.window()
            .then((win) => win.store.getState())
            .should("deep.include", initState);
    });
});

it("loads", () => {
    cy.get("h1").should("have.text", "This is the OPRE OPS system prototype.");
});

it("clicking on /cans nav takes you to CAN page", () => {
    cy.contains("CANs").click();
    cy.url().should("include", "/cans/");
    cy.get("h1").should("have.text", "CANs");
});

it("clicking on /portfolio nav while unauthenticated, should keep you at home page.", () => {
    cy.get("h1").should("have.text", "This is the OPRE OPS system prototype.");
    cy.url().should("include", "/");
});
