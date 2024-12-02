/// <reference types="cypress" />
import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y();
});

it("loads", () => {
    cy.get("h1").contains("This is the OPRE OPS system prototype");
});

it("clicking on /cans nav takes you to CAN page", () => {
    cy.contains("CANs").click();
    cy.url().should("include", "/cans/");
    cy.get("h1").should("have.text", "CANs");
});

it("clicking on /portfolio nav while unauthenticated, should keep you at home page.", () => {
    cy.get("h1").contains("This is the OPRE OPS system prototype");
    cy.url().should("include", "/");
});

it.skip("Simulate a fail, to test the Cypress Action upload", () => {
    expect(true).to.equal(false);
});
