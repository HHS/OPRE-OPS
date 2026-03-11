/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("budget-team");
    cy.visit("/projects");
    cy.contains("h1", "Loading...", { timeout: 30000 }).should("not.exist");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Projects List Page", () => {
    it("loads the projects list", () => {
        cy.url().should("include", "/projects");
        cy.get("h1").should("have.text", "Projects");
        cy.get("h2").should("contain.text", "All Projects");
        cy.get("table").should("exist");
        cy.get("table thead th").should("contain", "Project");
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
    });
});
