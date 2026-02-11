/// <reference types="cypress" />
import {terminalLog, testLogin} from "./utils";

describe("Agreements List - Pagination", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit("/agreements");
        cy.get("#fiscal-year-select").select("All");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    describe("Basic Pagination Navigation", () => {
        it("should display pagination controls when there are more than 10 agreements", () => {
            // Check if pagination navigation exists
            cy.get("nav[aria-label='Pagination']").should("exist");
            cy.get(".usa-pagination").should("exist");
        });

        it("should start on page 1 by default", () => {
            // First page button should be active/current
            cy.get("button.usa-current").should("contain", "1");
        });

        it("should navigate to next page when Next button is clicked", () => {
            // Click the Next button
            cy.get("button[aria-label='Next page']").should("not.be.disabled");
            cy.get("button[aria-label='Next page']").click();

            // Should now be on page 2
            cy.get("button.usa-current").should("contain", "2");

            // URL or table content should reflect page 2
            cy.get(".usa-table tbody tr").should("have.length.at.least", 1);
        });

        it("should navigate to previous page when Previous button is clicked", () => {
            // First go to page 2
            cy.get("button[aria-label='Next page']").click();
            cy.get("button.usa-current").should("contain", "2");

            // Click Previous button
            cy.get("button[aria-label='Previous page']").should("not.be.disabled");
            cy.get("button[aria-label='Previous page']").click();

            // Should be back on page 1
            cy.get("button.usa-current").should("contain", "1");
        });

        it("should navigate directly to a specific page number", () => {
            // Click on page number 2
            cy.get("button[aria-label='Page 2']").click();

            // Should be on page 2
            cy.get("button.usa-current").should("contain", "2");
        });

        it("should disable Previous button on first page", () => {
            // On page 1, Previous button is hidden (not just disabled)
            cy.get("button[aria-label='Previous page']").should("not.be.visible");
        });

        it("should hide Next button on last page", () => {
            // Navigate to last page (need to find what the last page is)
            // Get all page number buttons
            cy.get("button[aria-label^='Page']").last().then(($lastButton) => {
                // Click the last page number
                $lastButton.click();
            });

            // Next button should be hidden on last page
            cy.get("button[aria-label='Next page']").should("not.be.visible");
        });
    });
});
