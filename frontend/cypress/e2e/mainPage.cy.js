/// <reference types="cypress" />
import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("basic");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y();
});
describe("Home Page", () => {
    it("Home page loads", () => {
        cy.visit("/");
        cy.get("h1").contains("Plan, track & collaborate");
        cy.get("h2").contains("OPS Benefits");
        cy.get("h3").contains("Transparency");
        cy.get("h3").contains("Data visualization");
        cy.get("h3").contains("Autonomy");
        cy.get("h3").contains("Built-in approvals");
        cy.get("h3").contains("Real-time planning");
    });

    it("Release Notes loads", () => {
        cy.visit("/release-notes");
        cy.get("h1").contains("OPS Release Summary");
        // check the cards section data-cy="release-notes-cards"
        cy.get("[data-cy='release-notes-cards']").should("exist");
        cy.get("h2").contains("Release Notes");
    });
    it("Whats Next loads", () => {
        cy.visit("/next");
        cy.get("h1").contains("What's Next");
        cy.get("table").should("exist");
    });
});
