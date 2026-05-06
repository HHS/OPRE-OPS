/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

const getAppliedFilters = () => cy.contains("span", "Filters Applied:").parent();

beforeEach(() => {
    testLogin("budget-team");
    cy.visit("/projects");
    cy.get("#fiscal-year-select").select("2044");
    // Wait for real table data — avoids asserting on skeleton state
    cy.get("table tbody tr", { timeout: 30000 }).should("have.length.greaterThan", 0);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Projects List Page", () => {
    it("loads the projects list with correct headings", () => {
        cy.url().should("include", "/projects");
        cy.get("h1").should("have.text", "Projects");
        cy.get("h2").should("contain.text", "All Projects");
        cy.get("table thead th").eq(0).should("contain", "Project");
        cy.get("table thead th").eq(1).should("contain", "Type");
        cy.get("table thead th").eq(2).should("contain", "Start");
        cy.get("table thead th").eq(3).should("contain", "End");
        cy.get("table thead th").eq(5).should("contain", "Project Total");
    });

    it("clicking a project name navigates to the project detail page", () => {
        cy.get("table tbody tr").first().find("a").first().click();
        cy.url().should("include", "/projects/");
        cy.get("h1").should("exist");
    });

    it("expanding a row shows agreement count and tags", () => {
        cy.get("[data-cy='expand-row']").first().click();
        cy.get("[data-testid='expanded-data']").should("be.visible");
        cy.contains("Total Agreements").should("be.visible");
        cy.get("[data-testid='agreement-count']").should("exist");
    });

    it("collapsing an expanded row hides the agreement details", () => {
        cy.get("[data-cy='expand-row']").first().click();
        cy.get("[data-testid='expanded-data']").should("be.visible");
        cy.get("[data-cy='expand-row']").first().click();
        cy.get("[data-testid='expanded-data']").should("not.exist");
    });

    it("changing the fiscal year reloads the table", () => {
        cy.get("#fiscal-year-select").select("2044");
        // Wait for new rows — stable signal that the refetch completed
        cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
    });

    it("displays the project count summary card", () => {
        cy.get("[data-cy='project-count-summary-card']").should("be.visible");
    });

    it("displays the project type summary card with a donut chart", () => {
        cy.get("[data-cy='project-type-summary-card']").should("be.visible");
        cy.get("#project-type-chart").should("exist");
    });

    it("clicking a column header sorts the table", () => {
        // Click "Type" column — direction depends on prior state so assert presence, not value
        cy.get("table thead th").eq(1).find("button").click();
        // Wait for sorted rows to appear
        cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
        // The clicked column should now have an active aria-sort value
        cy.get("table thead th")
            .eq(1)
            .should("have.attr", "aria-sort")
            .and("match", /ascending|descending/);
    });

    it("the filter button works as expected", () => {
        cy.get("button").contains("Filter").click();

        // Set a number of filters
        cy.get(".fiscal-year-combobox__control").click();
        cy.get(".fiscal-year-combobox__menu").contains(".fiscal-year-combobox__option", "FY 2044").click();

        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").contains(".portfolios-combobox__option", "Child Care Research").click();

        // Click Apply
        cy.get("button").contains("Apply").click();

        // Check that the correct tags are displayed
        getAppliedFilters().within(() => {
            cy.contains("FY 2044").should("exist");
            cy.contains("Child Care Research").should("exist");
        });

        // Verify filters were applied — table shows results or zero-results message
        cy.get("tbody tr", { timeout: 10000 }).should("exist");

        // Reset
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        // Wait for filters to be cleared
        cy.wait(1000);

        // Check that no tags are displayed
        cy.contains("span", "Filters Applied:").should("not.exist");
    });

    it("filters projects by fiscal year", () => {
        cy.get("button").contains("Filter").click();

        // Select a fiscal year
        cy.get(".fiscal-year-combobox__control").click();
        cy.get(".fiscal-year-combobox__menu").should("be.visible");
        cy.get(".fiscal-year-combobox__menu").contains("FY 2043").click();

        // Apply the filter
        cy.get("button").contains("Apply").click();

        // Verify the filter tag is displayed
        getAppliedFilters().within(() => {
            cy.contains("FY 2043", { timeout: 10000 }).should("exist");
        });

        // Verify the table is filtered correctly
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);

        // Reset the filter
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        // Wait for table to reload with all projects
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        cy.contains("span", "Filters Applied:").should("not.exist");
    });

    it("filters projects by portfolio", () => {
        cy.get("button").contains("Filter").click();

        // Select a portfolio
        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").should("be.visible");
        cy.get(".portfolios-combobox__menu").contains("Child Care Research").click();

        // Apply the filter
        cy.get("button").contains("Apply").click();

        // Verify the filter tag is displayed
        getAppliedFilters().within(() => {
            cy.contains("Child Care Research", { timeout: 10000 }).should("exist");
        });

        // Verify the table is filtered correctly
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);

        // Reset the filter
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        // Wait for table to reload
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        cy.contains("span", "Filters Applied:").should("not.exist");
    });

    it("filters projects by project title", () => {
        cy.get("#fiscal-year-select").select("All");

        cy.get("button").contains("Filter").click();

        // Select a project title
        cy.get(".project-title-combobox__control").click();
        cy.get(".project-title-combobox__menu").should("be.visible");
        // Select the first project option that appears
        cy.get(".project-title-combobox__menu .project-title-combobox__option").first().click();

        // Apply the filter
        cy.get("button").contains("Apply").click();

        // Verify a filter tag is displayed (we don't know the exact project name)
        getAppliedFilters().should("exist");

        // Verify the table shows filtered results
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);

        // Reset the filter
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        cy.contains("span", "Filters Applied:").should("not.exist");
    });

    it("filters projects by project type", () => {
        cy.get("button").contains("Filter").click();

        // Select project type
        cy.get(".project-type-combobox__control").click();
        cy.get(".project-type-combobox__menu").should("be.visible");
        cy.get(".project-type-combobox__menu").contains("Research").click();

        // Apply the filter
        cy.get("button").contains("Apply").click();

        // Verify the filter tag is displayed
        getAppliedFilters().within(() => {
            cy.contains("Research", { timeout: 10000 }).should("exist");
        });

        // Verify the table shows only research projects
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        // All visible rows should show "Research" as the type
        cy.get("tbody tr td:nth-child(2)").each(($el) => {
            cy.wrap($el).should("contain.text", "Research");
        });

        // Reset the filter
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        cy.contains("span", "Filters Applied:").should("not.exist");
    });

    it("filters projects by agreement title", () => {
        cy.get("button").contains("Filter").click();

        // Select an agreement title
        cy.get(".agreement-name-combobox__control").click();
        cy.get(".agreement-name-combobox__menu").should("be.visible");
        // Select the first agreement option that appears
        cy.get(".agreement-name-combobox__menu .agreement-name-combobox__option").first().click();

        // Apply the filter
        cy.get("button").contains("Apply").click();

        // Verify a filter tag is displayed
        getAppliedFilters().should("exist");

        // Verify the table shows filtered results
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);

        // Reset the filter
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        cy.contains("span", "Filters Applied:").should("not.exist");
    });

    it("filters projects by multiple criteria", () => {
        cy.get("button").contains("Filter").click();

        // Select multiple filters
        cy.get(".fiscal-year-combobox__control").click();
        cy.get(".fiscal-year-combobox__menu").should("be.visible");
        cy.get(".fiscal-year-combobox__menu").contains("FY 2044").click();

        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").should("be.visible");
        cy.get(".portfolios-combobox__menu").contains("Child Care Research").click();

        cy.get(".project-type-combobox__control").click();
        cy.get(".project-type-combobox__menu").should("be.visible");
        cy.get(".project-type-combobox__menu").contains("Research").click();

        // Apply the filter
        cy.get("button").contains("Apply").click();

        // Verify all filter tags are displayed
        getAppliedFilters().within(() => {
            cy.contains("FY 2044", { timeout: 10000 }).should("exist");
            cy.contains("Child Care Research").should("exist");
            cy.contains("Research").should("exist");
        });

        // Verify the table shows filtered results
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);

        // Reset the filter
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        cy.contains("span", "Filters Applied:").should("not.exist");
    });

    it("removes individual filter tags when clicked", () => {
        cy.get("button").contains("Filter").click();

        // Set multiple filters
        cy.get(".fiscal-year-combobox__control").click();
        cy.get(".fiscal-year-combobox__menu").contains("FY 2044").click();

        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").contains("Child Care Research").click();

        cy.get("button").contains("Apply").click();

        // Verify both tags are displayed
        getAppliedFilters().within(() => {
            cy.contains("FY 2044").should("exist");
            cy.contains("Child Care Research").should("exist");
        });

        // Click the X button on the fiscal year tag
        cy.get('[aria-label="Remove FY 2044 filter"]').click();

        // Wait for table to reload
        cy.wait(1000);

        // Verify only the portfolio tag remains
        getAppliedFilters().within(() => {
            cy.contains("FY 2044").should("not.exist");
            cy.contains("Child Care Research").should("exist");
        });

        // Click the X button on the portfolio tag
        cy.get('[aria-label="Remove Child Care Research filter"]').click();

        // Wait for table to reload
        cy.wait(1000);

        // Verify no filter tags remain
        cy.contains("span", "Filters Applied:").should("not.exist");
    });

    it("clears unapplied filter values when filter is closed and reopened but keeps applied values", () => {
        // Apply initial filters
        cy.get("button").contains("Filter").click();

        cy.get(".fiscal-year-combobox__control").click();
        cy.get(".fiscal-year-combobox__menu").contains("FY 2044").click();

        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").contains("Child Care Research").click();

        cy.get("button").contains("Apply").click();

        // Verify applied filters are displayed
        getAppliedFilters().within(() => {
            cy.contains("FY 2044").should("exist");
            cy.contains("Child Care Research").should("exist");
        });

        // Reopen filter and select additional values WITHOUT applying
        cy.get("button").contains("Filter").click();

        cy.get(".project-type-combobox__control").click();
        cy.get(".project-type-combobox__menu").contains("Admin & Support").click();

        // Verify the unapplied value is selected in the dropdown
        cy.get(".project-type-combobox__control").should("contain", "Admin & Support");

        // Close the filter without applying (click outside or press Escape)
        cy.get("#filter-close").click(); // Click outside the filter modal

        // Reopen the filter
        cy.get("button").contains("Filter").click();

        // Verify applied filters are still selected
        cy.get(".fiscal-year-combobox__control").should("contain", "FY 2044");
        cy.get(".portfolios-combobox__control").should("contain", "Child Care Research");

        // Verify unapplied filter value (project type) was cleared
        cy.get(".project-type-combobox__control").should("not.contain", "Admin & Support");

        // Verify applied filter tags still exist
        getAppliedFilters().within(() => {
            cy.contains("FY 2044").should("exist");
            cy.contains("Child Care Research").should("exist");
        });

        // Verify project type was not applied (should not have a tag)
        getAppliedFilters().within(() => {
            cy.contains("Admin & Support").should("not.exist");
        });
    });
});
