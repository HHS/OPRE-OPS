/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("budget-team");
    cy.visit("/portfolios");
    cy.contains("h1", "Loading...", { timeout: 30000 }).should("not.exist");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Portfolio List Page", () => {
    it("loads with correct page structure and data", () => {
        cy.get("h1").should("have.text", "Portfolios");
        cy.get("h2").should("contain.text", "All Portfolios");
        cy.get("select").first().should("exist"); // FY selector
        cy.get("table thead th").should("contain", "Portfolio");
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
        cy.get('[data-cy="portfolio-export"]').should("exist");
        cy.contains("button", "Filter").should("exist");
        cy.get('[data-cy="portfolio-budget-summary-card"]').should("exist");
    });

    it("switches between tabs and shows/hides summary cards", () => {
        // All Portfolios tab
        cy.get("h2").should("contain.text", "All Portfolios");
        cy.get('[data-cy="portfolio-budget-summary-card"]').should("exist");
        cy.get('[data-testid="portfolio-legend"]').should("exist");

        // Switch to My Portfolios
        cy.contains("button", "My Portfolios").click();
        cy.get("h2").should("contain.text", "My Portfolios");
        cy.get('[data-cy="portfolio-budget-summary-card"]').should("not.exist");
        cy.get('[data-testid="portfolio-legend"]').should("not.exist");

        // Switch back
        cy.contains("button", "All Portfolios").click();
        cy.get('[data-cy="portfolio-budget-summary-card"]').should("exist");
    });

    it("changes fiscal year and navigates to detail page with FY parameter", () => {
        cy.get("select").first().select("2023");
        // Wait for data to reload by checking for table rows
        cy.get("table tbody tr", { timeout: 10000 }).should("exist");

        // Click first portfolio link
        cy.get("table tbody tr").first().find("a").first().click();

        // Verify URL has fiscal year parameter
        cy.url().should("include", "/portfolios/");
        cy.url().should("include", "/spending");
        cy.url().should("include", "fy=2023");

        // Verify detail page loaded
        cy.get("h1", { timeout: 10000 }).should("exist");
    });

    it("applies filters and shows filter tags", () => {
        cy.get("button").contains("Filter").click();

        // Select portfolio filter
        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").find(".portfolios-combobox__option").first().click();

        // Apply filters
        cy.get("button").contains("Apply").click();

        // Verify filter tags
        cy.get("div").contains("Filters Applied:").should("exist");

        // Verify table updated
        cy.get("table tbody tr").should("have.length.greaterThan", 0);

        // Remove filter tag (click SVG icon)
        cy.get("svg[id^='filter-tag-']").first().click();

        // Reset all filters
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        // Verify no filters
        cy.get("div").contains("Filters Applied:").should("not.exist");
    });

    it("sorts table by clicking column headers", () => {
        // Sort by Portfolio name
        cy.get("thead th").contains("Portfolio").click();
        cy.get("thead th").contains("Portfolio").parent().should("have.attr", "aria-sort");

        // Reverse sort
        cy.get("thead th").contains("Portfolio").click();
        cy.get("thead th").contains("Portfolio").parent().should("have.attr", "aria-sort", "ascending");
    });

    it("export button visibility changes based on filtered results", () => {
        // When page loaded, export button should exist
        cy.get('[data-cy="portfolio-export"]').should("exist");

        // Apply filter: Available Budget = Less than 25% available
        cy.get("button").contains("Filter").click();
        cy.get(".available-budget-percentage-combobox__control").click();
        cy.get(".available-budget-percentage-combobox__menu").contains("Less than 25% available").click();
        cy.get("button").contains("Apply").click();

        // Export button should be invisible (no matching portfolios)
        cy.get('[data-cy="portfolio-export"]').should("not.exist");
    });

    it("shows portfolio legend with correct data and formatting", () => {
        cy.get('[data-testid="portfolio-legend"]').should("exist");

        cy.get('[data-cy^="portfolio-legend-item-"]').should("have.length.greaterThan", 0);

        // Check first legend item structure
        cy.get('[data-cy^="portfolio-legend-item-"]')
            .first()
            .within(() => {
                // Has color indicator (FontAwesome circle)
                cy.get("svg").should("exist");

                // Has abbreviation text
                cy.get("span").should("exist");

                // Has dollar amount
                cy.contains("$").should("exist");

                // Has percentage
                cy.contains("%").should("exist");
            });
    });

    it("handles empty state when no portfolios match filters", () => {
        // Apply filter: Available Budget = Less than 25% available
        cy.get("button").contains("Filter").click();
        cy.get(".available-budget-percentage-combobox__control").click();
        cy.get(".available-budget-percentage-combobox__menu").contains("Less than 25% available").click();
        cy.get("button").contains("Apply").click();

        // Verify table empty or shows message
        cy.get("table tbody tr").should("have.length", 0);

        // Export button should be hidden
        cy.get('[data-cy="portfolio-export"]').should("not.exist");
    });
});
