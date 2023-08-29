/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/budget-lines");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.get("h1").should("have.text", "Budget Lines");
    cy.get("h2").should("have.text", "All Budget Lines");
});

it("budget line items link defaults to all-budget-line-items", () => {
    cy.visit("/");
    cy.get("a").contains("Budget Lines");
    cy.get('a[href="/budget-lines?filter=all-budget-line-items"]').should("exist");
});

it("clicking the add budget lines button takes you to the create budget lines page", () => {
    cy.get("a").contains("Add Budget Lines");
    cy.get('a[href="/budget-lines/create"]').should("exist");
});
