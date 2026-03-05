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
        cy.get("h2").contains("How-to Guides");
    });

    it("supports deep links for How-to Guide accordion items", () => {
        cy.visit("/help-center#how-to-find-your-user-role");
        cy.get("button")
            .contains("How to find your user role")
            .should("have.attr", "aria-expanded", "true");

        cy.get("button").contains("How to view notifications").click();
        cy.url().should("include", "#how-to-view-notifications");
    });

    it("renders the FAQ", () => {
        cy.visit("/help-center/faq");
        cy.get("h1").contains("Help Center");
        cy.get("h2").contains("Frequently Asked Questions");
    });

    it("supports deep links for FAQ accordion items", () => {
        cy.visit("/help-center/faq#how-do-i-learn-how-to-use-ops");
        cy.get("button")
            .contains("How do I learn how to use OPS?")
            .should("have.attr", "aria-expanded", "true");

        cy.get("button").contains("What is OPS?").click();
        cy.url().should("include", "#what-is-ops");
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
        cy.get("h2").contains("Share Feedback");
        cy.get("p").contains("Your feedback matters to us!");
    });
});
