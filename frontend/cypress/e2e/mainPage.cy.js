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

it("Home page loads", () => {
    cy.get("h1").contains("Plan, track & collaborate");
    cy.get("h2").contains("OPS Benefits");
    cy.get("h3").contains("Transparency");
    cy.get("h3").contains("Data visualization");
    cy.get("h3").contains("Autonomy");
    cy.get("h3").contains("Built-in approvals");
    cy.get("h3").contains("Real-time planning");
});

it.skip("Simulate a fail, to test the Cypress Action upload", () => {
    expect(true).to.equal(false);
});
