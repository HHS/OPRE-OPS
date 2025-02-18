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
    it("renders the How-to Guide", () => {
        cy.visit("/help-center");
        cy.get("h1").contains("Help Center");
        cy.get("h2").contains("How-to Guide");
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
