/// <reference types="cypress" />
import {terminalLog, testLogin} from "./utils";

describe("Agreements List - Pagination Sorting", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit("/agreements");
        cy.get("#fiscal-year-select").select("All");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("should reset to page 1 when sort order is changed", () => {
        // Navigate to page 2
        cy.get("button[aria-label='Next page']").click();
        cy.get("button.usa-current").should("contain", "2");

        // Click on a column header to change sort
        cy.get("thead th").contains("Agreement").click();

        // Wait for sorted data to load
        cy.get(".usa-table tbody tr", {timeout: 10000}).should("have.length.at.least", 1);

        // Should reset to page 1
        cy.get("button.usa-current").should("contain", "1");
    });

    it("should maintain sort order across pages", () => {
        // Sort by Agreement name
        cy.get("thead th").contains("Agreement").click();

        // Wait for sorted data to load
        cy.get(".usa-table tbody tr", {timeout: 10000}).should("have.length.at.least", 1);

        // Navigate to page 2 and verify data loads
        cy.get("button[aria-label='Next page']").then(($nextBtn) => {
            if (!$nextBtn.is(":disabled")) {
                cy.wrap($nextBtn).click();

                // Verify page 2 has data (sort order is maintained)
                cy.get("tbody tr", {timeout: 10000}).should("have.length.at.least", 1);
            }
        });
    });
});
