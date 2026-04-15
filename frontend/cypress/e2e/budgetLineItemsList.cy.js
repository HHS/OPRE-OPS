/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

const ALL_BLI_TOTAL_2044 = "1,743,043,573.00";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/budget-lines");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get("h1").should("have.text", "Budget Lines");
    cy.get("h2").should("have.text", "All Budget Lines");
    cy.get('[data-cy="bl-total-summary-card"]').should("exist");
    cy.get('[data-cy="bli-status-summary-card"]').should("exist");
    cy.get(".usa-table").should("exist");
});

it("pagination on the bli table works as expected", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get("ul").should("have.class", "usa-pagination__list");
    cy.get("li").should("have.class", "usa-pagination__item").contains("1");
    cy.get("button").should("have.class", "usa-current").contains("1");
    cy.get("li").should("have.class", "usa-pagination__item").contains("2");
    cy.get("li").should("have.class", "usa-pagination__item").contains("Next");
    cy.get("tbody").find("tr").should("have.length", 10);
    cy.get("li")
        .should("have.class", "usa-pagination__item")
        .contains("Previous")
        .find("svg")
        .should("have.attr", "aria-hidden", "true");

    // go to the second page
    cy.get("li").should("have.class", "usa-pagination__item").contains("2").click();
    cy.get("button").should("have.class", "usa-current").contains("2");
    cy.get("li").should("have.class", "usa-pagination__item").contains("Previous");
    cy.get("li")
        .should("have.class", "usa-pagination__item")
        .contains("Next")
        .find("svg")
        .should("have.attr", "aria-hidden", "true");

    // go back to the first page
    cy.get("li").should("have.class", "usa-pagination__item").contains("1").click();
    cy.get("button").should("have.class", "usa-current").contains("1");
});

it("filter button works as expected", () => {
    cy.get("button").contains("Filter").click();

    // set a number of filters

    cy.get(".fiscal-year-combobox__control")
        .click()
        .get(".fiscal-year-combobox__menu")
        .find(".fiscal-year-combobox__option")
        .contains("2043")
        .click();
    cy.get(".portfolios-combobox__control")
        .click()
        .get(".portfolios-combobox__menu")
        .find(".portfolios-combobox__option")
        .contains("Child Welfare Research")
        .click();
    cy.get(".agreement-type-combobox__control")
        .click()
        .get(".agreement-type-combobox__menu")
        .find(".agreement-type-combobox__option")
        .contains("Contract")
        .click();
    cy.get(".agreement-name-combobox__control")
        .click()
        .get(".agreement-name-combobox__menu")
        .find(".agreement-name-combobox__option")
        .eq(1) // select the second option
        .click();
    cy.get(".can-active-period-combobox__control")
        .click()
        .get(".can-active-period-combobox__menu")
        .find(".can-active-period-combobox__option")
        .contains("5 Year")
        .click();

    cy.get("[data-testid='budget-range-slider']").within(() => {
        // Get the initial values
        cy.get(".thumb.thumb-0").invoke("attr", "aria-valuenow").as("initialMin");
        cy.get(".thumb.thumb-1").invoke("attr", "aria-valuenow").as("initialMax");

        cy.get(".thumb.thumb-0").then(($el) => {
            const width = $el.width();
            const height = $el.height();
            // Split the chain to avoid unsafe subject usage
            cy.wrap($el).trigger("mousedown", { which: 1, pageX: 0, pageY: (height || 0) / 2 });
            cy.wrap($el).trigger("mousemove", { which: 1, pageX: (width || 0) * 0.2, pageY: (height || 0) / 2 });
            cy.wrap($el).trigger("mouseup");
        });

        cy.get(".thumb.thumb-1").then(($el) => {
            const width = $el.width();
            const height = $el.height();
            // Split the chain to avoid unsafe subject usage
            cy.wrap($el).trigger("mousedown", { which: 1, pageX: width || 0, pageY: (height || 0) / 2 });
            cy.wrap($el).trigger("mousemove", { which: 1, pageX: (width || 0) * 0.8, pageY: (height || 0) / 2 });
            cy.wrap($el).trigger("mouseup");
        });
    });

    // click the button that has text Apply
    cy.get("button").contains("Apply").click();

    // check that the correct tags are displayed
    cy.get("div").contains("Filters Applied:").should("exist");
    cy.get("button[id='filter-tag-fiscalYears-0']").should("exist");
    cy.get("button[id='filter-tag-portfolios-1']").should("exist");
    cy.get("button[id='filter-tag-budgetRange-2']").should("exist");
    cy.get("button[id='filter-tag-agreementTypes-3']").should("exist");
    cy.get("button[id='filter-tag-agreementTitles-4']").should("exist");
    cy.get("button[id='filter-tag-canActivePeriods-5']").should("exist");

    cy.get("div").contains("FY 2043").should("exist");
    cy.get("div").contains("Child Welfare Research").should("exist");
    cy.get("div").contains("Contract").should("exist");
    cy.get("div").contains("Contract #1: African American Child and Family Research Center").should("exist");
    cy.get("div").contains("5 Year").should("exist");

    // check that the table is filtered correctly
    cy.get("div[id='budget-line-items-table-zero-results']").should("not.exist");

    // reset
    cy.get("button").contains("Filter").click();
    cy.get("button").contains("Reset").click();
    cy.get("button").contains("Apply").click();

    // check that the correct tags are displayed
    cy.get("div").contains("Filters Applied:").should("not.exist");
    cy.get("button[id='filter-tag-fiscalYears-0']").should("not.exist");
    cy.get("button[id='filter-tag-portfolios-1']").should("not.exist");
    cy.get("button[id='filter-tag-budgetRange-2']").should("not.exist");
    cy.get("button[id='filter-tag-agreementTypes-3']").should("not.exist");
    cy.get("button[id='filter-tag-agreementTitles-4']").should("not.exist");
    cy.get("button[id='filter-tag-canActivePeriods-5']").should("not.exist");
});

it("filter button does not reset fiscal year dropdown when fiscal year dropdown is changed from current FY", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get("button").contains("Filter").click();

    // set a number of filters

    cy.get(".bli-status-combobox__control")
        .click()
        .get(".bli-status-combobox__menu")
        .find(".bli-status-combobox__option")
        .contains("Draft")
        .click();

    // click the button that has text Apply
    cy.get("button").contains("Apply").click();

    // Check that the same year is still provided
    cy.get("#fiscal-year-select").should("have.value", "2044");
});

it("click on chevron down should open row and see budgetline data", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get("tbody").find('[data-cy="expanded-data"]').should("not.exist");
    cy.get("tbody").find("tr").first().find('[data-cy="expand-row"]').click();
    cy.get("tbody").find('[data-cy="expanded-data"]').as("expandedRow").should("exist");
    cy.get("@expandedRow").contains("Created by");
    cy.get("@expandedRow").contains("Description");
    cy.get("@expandedRow").contains("Procurement Shop");
    cy.get("@expandedRow").contains("Subtotal");
    cy.get("@expandedRow").contains("Fees");
    cy.get("@expandedRow").contains("Project");
    cy.get("@expandedRow").contains("Award Type");
    cy.get("@expandedRow").contains("Research Type");
    cy.get("@expandedRow").contains("Vendor");
});

it("click on agreement name and check if its routed to the correct page", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get("[data-testid='budget-line-row-16022']").find("a").click();
    cy.url().should("include", "/agreements/1");
});

it.skip("click on edit bli and check to see if the form is populated", () => {
    cy.get("[data-testid='budget-line-row-15249']").trigger("mouseover");
    cy.get("[data-testid='budget-line-row-15249']").find('[data-cy="edit-row"]').should("exist");
    cy.get("[data-testid='budget-line-row-15249']").find('[data-cy="edit-row"]').click();
    cy.url().should("include", "/agreements/1/budget-lines");
    cy.get("#allServicesComponentSelect").should("have.value", "1");
    cy.get(".can-combobox__single-value").should("have.text", "G994426");
    cy.get("#need-by-date").should("have.value", "06/13/2043");
    cy.get("#enteredAmount").should("have.value", "1,000,000");
    cy.get('[data-cy="update-budget-line"]').should("exist");
});
// TODO: fix this test - this takes too long to run and is indicative of a performance issue
it.skip("Should filter all budgetlines vs my budget lines", () => {
    cy.get('[data-cy="bl-total-summary-card"]').as("total-bli-card").should("exist");
    cy.get("@total-bli-card").contains(ALL_BLI_TOTAL_2044);
    cy.get('[data-cy="tab-selected"]').as("tab-selected").should("exist");
    cy.get('[data-cy="tab-not-selected"]').as("tab-selected").should("exist");
    cy.get('[data-cy="tab-not-selected"]').click();
    cy.get("@total-bli-card").contains(ALL_BLI_TOTAL_2044);
    // cy.visit("/");
    // cy.contains("Sign-Out").click();
    // testLogin("basic");
    // cy.visit("/budget-lines").wait(1000);
    // cy.get("@total-bli-card").contains(ALL_BLI_TOTAL);
    // cy.get('[data-cy="tab-not-selected"]').click();
    // cy.get('[data-cy="tab-selected"]').should('exist');
    // cy.get('@total-bli-card').should('be.visible');
    // cy.get("@total-bli-card").should('contain', '0');
});

it("Should allow the user to export table", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get('[data-cy="budget-line-export"]').should("exist");

    cy.get("#fiscal-year-select").select("2026");
    cy.get('[data-cy="budget-line-export"]').should("not.exist");
});
