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

    it("the skip link is the first focusable element, visible on focus, and moves focus to main content", () => {
        cy.visit("/");

        // Cypress has no real-Tab-key simulation installed in this project, so DOM order
        // stands in for "first Tab stop" here; the full keyboard Tab/Shift+Tab pass is
        // verified manually per the story's test method.
        cy.get(".usa-skipnav")
            .should("contain.text", "Skip to main content")
            .then(($skipLink) => {
                cy.get("a, button, input, [tabindex]")
                    .first()
                    .then(($firstFocusable) => {
                        expect($firstFocusable[0]).to.equal($skipLink[0]);
                    });
            });

        cy.get(".usa-skipnav").focus().should("be.visible").click();
        cy.focused().should("have.id", "main-content");
    });

    it("Return to top moves focus along with the view, so the next Tab continues from the top of the page", () => {
        cy.visit("/");
        cy.get("button").contains("Return to top").scrollIntoView().click();
        cy.focused().should("have.id", "main-content");
    });

    it("the What's New tab shows a visible focus ring when reached by keyboard", () => {
        cy.visit("/");
        cy.get(`[data-cy="details-tab-What's New"]`).focus();
        cy.focused().should("have.css", "outline-style", "solid").and("have.css", "outline-width", "4px");
    });

    it("Esc closes the Create header dropdown and returns focus to its toggle", () => {
        cy.visit("/");
        cy.contains("button", "Create").as("createToggle").click();
        cy.get("@createToggle").should("have.attr", "aria-expanded", "true");

        cy.get("#basic-mega-nav-section-two").contains("a", "Project").focus().type("{esc}");

        cy.get("@createToggle").should("have.attr", "aria-expanded", "false");
        cy.focused().should("contain.text", "Create");
    });
});
