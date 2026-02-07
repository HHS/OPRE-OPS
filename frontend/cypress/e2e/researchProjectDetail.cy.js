/// <reference types="cypress" />
import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/research-projects/1000");
    // Wait for page to load by checking for the h1 element
    cy.get("h1", { timeout: 10000 }).should("be.visible");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y();
});

it("loads", () => {
    cy.get("h1").should("contain", "Human Services Interoperability Support");
    cy.get("h2").should("contain", "Division");
    cy.get("span").should("contain", "Chris Fortunato");
});
