/// <reference types="cypress" />
import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("basic");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y();
});

describe("Help Center", () => {
    it("renders the User Guide", () => {
        cy.visit("/help-center");
        cy.get("h1").contains("Help Center");
        cy.get("h2").contains("How-to Guide");
        cy.get("h3").contains("Table of Contents");
        // click on How to edit a budget line from nav and check url to have slug
        cy.get("a").contains("How to edit a budget line").click();
        cy.url().should("include", "how-to-edit-a-budget-line");
    });
    it("renders the FAQ", () => {
        cy.visit("/help-center/faq");
        cy.get("h1").contains("Help Center");
        cy.get("h2").contains("Frequently Asked Questions");
    });
    it("renders the Glossary", () => {
        cy.visit("/help-center/glossary");
        cy.get("h1").contains("Help Center");
        cy.get("h2").contains("Glossary");
        // test glossary navigation
        // get link with href that contains section-P
        cy.get("a[href*='section-P']").click();
        cy.url().should("include", "#section-P");
    });
    it("renders Share Feedback", () => {
        cy.visit("/help-center/feedback");
        cy.get("h1").contains("Help Center");
        cy.get("h2").contains("We’d love to hear from you!");
    });
});
