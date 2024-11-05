/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("CAN detail page", () => {
    it("loads", () => {
        cy.visit("/cans/502/");
        cy.get("h1").should("contain", "G99PHS9"); // heading
        cy.get("p").should("contain", "SSRD - 5 Years"); // sub-heading
        cy.get("span").should("contain", "Nicole Deterding"); // team member
        cy.get("span").should("contain", "Director Derrek"); // division director
        cy.get("span").should("contain", "Program Support"); // portfolio
    });
});
