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
    it("Home page loads with the summary band", () => {
        cy.visit("/");
        cy.get("h1").contains("Here’s the latest");
        cy.get("[data-cy='home-summary']").should("exist");
        cy.get("h2").contains("OPS Release Summary");
    });

    it("Release summary card loads", () => {
        cy.visit("/");
        cy.get("[data-cy='release-summary-card']").within(() => {
            cy.get("h3").contains("Last Release");
            cy.get("h3").contains("OPS Version");
            cy.get("h3").contains("Release Changes");
        });
    });

    it("Priorities summary card loads", () => {
        cy.visit("/");
        cy.get("[data-cy='priorities-summary-card']").within(() => {
            cy.get("h3").contains("Currently Developing");
            cy.get("h3").contains("Next Up");
        });
    });

    it("What's New tab loads the latest release notes", () => {
        cy.visit("/");
        cy.contains("button", "What's New").should("exist");
        cy.get("[data-cy='latest-release-heading']").should("exist");
        cy.get("h2").contains("Release Notes");
    });

    it("Legacy release notes and what's next routes redirect home", () => {
        cy.visit("/release-notes");
        cy.url().should("match", /\/$/);
        cy.get("[data-cy='home-summary']").should("exist");

        cy.visit("/next");
        cy.url().should("match", /\/$/);
        cy.get("[data-cy='home-summary']").should("exist");
    });
});
