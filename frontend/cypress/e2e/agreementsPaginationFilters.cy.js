/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

describe("Agreements List - Pagination Filters", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit("/agreements");
        cy.get("#fiscal-year-select").select("All");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("should reset to page 1 when a filter is applied", () => {
        // Navigate to page 2 first
        cy.get("button[aria-label='Next page']").click();
        cy.get("button.usa-current").should("contain", "2");

        // Open filter modal
        cy.get("button").contains("Filter").click();

        // Apply a fiscal year filter
        cy.get(".fiscal-year-combobox__control").click();
        cy.get(".fiscal-year-combobox__menu").find(".fiscal-year-combobox__option").first().click();

        // Apply filter
        cy.get("button").contains("Apply").click();

        // Wait for filtered data to load
        cy.get(".usa-table tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);

        // Should reset to page 1
        cy.get("button.usa-current").should("contain", "1");
    });

    it("should show pagination controls with filtered results", () => {
        // Apply filter
        cy.get("button").contains("Filter").click();
        cy.get(".fiscal-year-combobox__control").click();
        cy.get(".fiscal-year-combobox__menu").find(".fiscal-year-combobox__option").last().click();
        cy.get("button").contains("Apply").click();

        // Wait for filtered data to load
        cy.get(".usa-table tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);

        // Pagination should exist if filtered results > 10
        cy.get("body").then(($body) => {
            if ($body.find("nav[aria-label='Pagination']").length > 0) {
                // Should be able to navigate pages with filter applied
                cy.get("button[aria-label='Next page']").then(($nextBtn) => {
                    if (!$nextBtn.is(":disabled")) {
                        cy.wrap($nextBtn).click();
                        cy.get("button.usa-current").should("contain", "2");
                    }
                });
            }
        });
    });

    it("should work with My Agreements tab", () => {
        // Navigate to My Agreements tab
        cy.visit("/agreements?filter=my-agreements");
        cy.get("#fiscal-year-select").select("All");
        // Wait for page to load by checking for h1 (increased timeout for CI)
        cy.get("h1", { timeout: 20000 }).should("have.text", "Agreements");

        // Wait for table data to load
        cy.get(".usa-table tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);

        // Pagination should exist if user has > 10 agreements
        cy.get("body").then(($body) => {
            if ($body.find("nav[aria-label='Pagination']").length > 0) {
                // Test pagination on My Agreements
                cy.get("button[aria-label='Next page']").then(($nextBtn) => {
                    if (!$nextBtn.is(":disabled")) {
                        cy.wrap($nextBtn).click();
                        cy.get("button.usa-current").should("contain", "2");
                    }
                });
            }
        });
    });
});
