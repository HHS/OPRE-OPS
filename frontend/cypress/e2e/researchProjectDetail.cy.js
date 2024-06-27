/// <reference types="cypress" />
import { testLogin } from "./utils";

before(() => {
    testLogin("admin");
    cy.visit("/research-projects/1000");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y();
});

it("loads", () => {
    cy.get("h1").should("contain", "Human Services Interoperability Support");
    cy.get("h2").should("contain", "Division");
    cy.get("span").should("contain", "Chris Fortunato");
    cy.get("div").should("contain", "SURVEY");
    cy.get("div").should("contain", "POPULATION_1");
});
