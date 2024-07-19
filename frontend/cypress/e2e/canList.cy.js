/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/cans");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    // beforeEach has ran...
    cy.get("h1").should("have.text", "CANs");
    cy.get('a[href="/cans/502"]').should("exist");
});

it("clicking on a CAN takes you to the detail page", () => {
    // beforeEach has ran...
    const canNumber = "G99PHS9";

    cy.contains(canNumber).click();

    cy.url().should("include", "/cans/502");
    cy.get("h1").should("contain", canNumber);
});
