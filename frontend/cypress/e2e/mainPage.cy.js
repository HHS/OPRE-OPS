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
    it("Home page loads with the What's New tab by default", () => {
        cy.visit("/");
        cy.get("[data-cy='welcome-message']").should("exist");
        cy.get("h2").contains("OPS Updates");
        cy.get(`[data-cy="details-tab-What's New"]`).should("exist");
        cy.get(`[data-cy="details-tab-OPS at a Glance"]`).should("exist");
        cy.get(`[data-cy="details-tab-OPS Benefits"]`).should("exist");
        cy.get("h2").contains("What's New");
    });

    it("OPS Benefits tab loads", () => {
        cy.visit("/ops-benefits");
        cy.get("h2").contains("OPS Benefits");
        cy.get("h3").contains("Transparency");
        cy.get("h3").contains("Data visualization");
        cy.get("h3").contains("Autonomy");
        cy.get("h3").contains("Built-in approvals");
        cy.get("h3").contains("Real-time planning");
    });

    it("OPS at a Glance tab loads", () => {
        cy.visit("/ops-at-a-glance");
        cy.get("h2").contains("OPS at a Glance");
        cy.get("[data-cy='roadmap-status-card']").should("exist");
    });

    it("Legacy /release-notes bookmark redirects to the home tab", () => {
        cy.visit("/release-notes");
        cy.location("pathname").should("eq", "/");
        cy.get("h2").contains("What's New");
    });

    it("Legacy /next bookmark redirects to the OPS at a Glance tab", () => {
        cy.visit("/next");
        cy.location("pathname").should("eq", "/ops-at-a-glance");
        cy.get("h2").contains("OPS at a Glance");
    });
});
