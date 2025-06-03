/// <reference types="cypress" />
import { testLogin } from "./utils";
import { All_BUDGET_LINES_TABLE_HEADINGS_LIST } from "../../src/components/BudgetLineItems/AllBudgetLinesTable/AllBudgetLinesTable.constants";
const ALL_BLI_TOTAL = "4,950,019,451.74";
const DRAFT_BLI_TOTAL = "1,530,006,742.82";
const EXECUTING_BLI_TOTAL = "773,259,769.18";
const PLANNED_BLI_TOTAL = "1,489,323,434.94";
const OBLIGATED_BLI_TOTAL = "1,157,429,504.81";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/budget-lines");
    cy.wait(500);
});

// TODO: fix a11y issues
// afterEach(() => {
//     cy.injectAxe();
//     cy.checkA11y(null, null, terminalLog);
// });

it("loads", () => {
    cy.get("h1").should("have.text", "Budget Lines");
    cy.get("h2").should("have.text", "All Budget Lines");
    cy.get("#budget-line-status-chart").should("be.visible");
});

it("budget line items link defaults to all-budget-line-items", () => {
    cy.visit("/");
    cy.get("a").contains("Budget Lines");
    cy.get('a[href="/budget-lines"]').should("exist");
});

it("pagination on the bli table works as expected", () => {
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

it("the filter button works as expected", () => {
    cy.get("button").contains("Filter").click();

    // set a number of filters

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".fiscal-year-combobox__control")
        .click()
        .get(".fiscal-year-combobox__menu")
        .find(".fiscal-year-combobox__option")
        .contains("2043")
        .click();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".portfolios-combobox__control")
        .click()
        .get(".portfolios-combobox__menu")
        .find(".portfolios-combobox__option")
        .contains("Child Welfare Research")
        .click();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".bli-status-combobox__control")
        .click()
        .get(".bli-status-combobox__menu")
        .find(".bli-status-combobox__option")
        .contains("Draft")
        .click();

    // click the button that has text Apply
    cy.get("button").contains("Apply").click();

    // check that the correct tags are displayed
    cy.get("div").contains("Filters Applied:").should("exist");
    cy.get("svg[id='filter-tag-fiscalYears']").should("exist");
    cy.get("svg[id='filter-tag-portfolios']").should("exist");
    cy.get("svg[id='filter-tag-bliStatus']").should("exist");

    cy.get("div").contains("FY 2043").should("exist");
    cy.get("div").contains("Child Welfare Research").should("exist");
    cy.get("div").contains("Draft").should("exist");

    // check that the table is filtered correctly
    cy.get("div[id='budget-line-items-table-zero-results']").should("not.exist");

    // reset
    cy.get("button").contains("Filter").click();
    cy.get("button").contains("Reset").click();
    cy.get("button").contains("Apply").click();

    // check that the correct tags are displayed
    cy.get("div").contains("Filters Applied:").should("not.exist");
    cy.get("svg[id='filter-tag-fiscalYears']").should("not.exist");
    cy.get("svg[id='filter-tag-portfolios']").should("not.exist");
    cy.get("svg[id='filter-tag-bliStatus']").should("not.exist");

    // check that the table is filtered correctly
    cy.get("div[id='budget-line-items-table-zero-results']").should("not.exist");
});

it("click on chevron down should open row and see budgetline data", () => {
    cy.get("tbody").find('[data-cy="expanded-data"]').should("not.exist");
    cy.get("tbody").find("tr").first().find('[data-cy="expand-row"]').click();
    cy.get("tbody").find('[data-cy="expanded-data"]').as("expandedRow").should("exist");
    cy.get("@expandedRow").contains("Created By");
    cy.get("@expandedRow").contains("Description");
    cy.get("@expandedRow").contains("Procurement Shop");
    cy.get("@expandedRow").contains("SubTotal");
    cy.get("@expandedRow").contains("Fees");
});

it("click on agreement name and check if its routed to the correct page", () => {
    cy.get("[data-testid='budget-line-row-15000']").find("a").click();
    cy.url().should("include", "/agreements/1");
});

it.skip("click on edit bli and check to see if the form is populated", () => {
    cy.get("[data-testid='budget-line-row-15000']").trigger("mouseover");
    cy.get("[data-testid='budget-line-row-15000']").find('[data-cy="edit-row"]').should("exist");
    cy.get("[data-testid='budget-line-row-15000']").find('[data-cy="edit-row"]').click();
    cy.url().should("include", "/agreements/1/budget-lines");
    cy.wait(2000);
    cy.get("#allServicesComponentSelect").should("have.value", "1");
    cy.get(".can-combobox__single-value").should("have.text", "G994426");
    cy.get("#need-by-date").should("have.value", "06/13/2043");
    cy.get("#enteredAmount").should("have.value", "1,000,000");
    cy.get('[data-cy="update-budget-line"]').should("exist");
});

it("Total BLI Summary Card should calculate the total amount of the budget line items by status", () => {
    cy.wait(5000);
    cy.get('[data-cy="bl-total-summary-card"]').as("total-bli-card").should("exist");
    cy.get("@total-bli-card").contains("Budget Lines Total");
    cy.get("@total-bli-card").contains(ALL_BLI_TOTAL);

    filterByStatus("Draft");
    cy.get("@total-bli-card").contains(DRAFT_BLI_TOTAL);

    filterByStatus("Planned");
    cy.get("@total-bli-card").contains(PLANNED_BLI_TOTAL);

    filterByStatus("Executing");
    cy.get("@total-bli-card").contains(EXECUTING_BLI_TOTAL);

    filterByStatus("Obligated");
    cy.get("@total-bli-card").contains(OBLIGATED_BLI_TOTAL);
});

// TODO: fix this test - this takes too long to run and is indicative of a performance issue
it.skip("Should filter all budgetlines vs my budget lines", () => {
    cy.get('[data-cy="bl-total-summary-card"]').as("total-bli-card").should("exist");
    cy.get("@total-bli-card").contains(ALL_BLI_TOTAL);
    cy.get('[data-cy="tab-selected"]').as("tab-selected").should("exist");
    cy.get('[data-cy="tab-not-selected"]').as("tab-selected").should("exist");
    cy.get('[data-cy="tab-not-selected"]').click();
    cy.get("@total-bli-card").contains(ALL_BLI_TOTAL);
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
    cy.get('[data-cy="budget-line-export"]').should("exist");

    cy.get("button").contains("Filter").click();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".fiscal-year-combobox__control")
        .click()
        .get(".fiscal-year-combobox__menu")
        .find(".fiscal-year-combobox__option")
        .contains("2022")
        .click();

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".bli-status-combobox__control")
        .click()
        .get(".bli-status-combobox__menu")
        .find(".bli-status-combobox__option")
        .contains("Obligated")
        .click();
    cy.get("button").contains("Apply").click();

    cy.get('[data-cy="budget-line-export"]').should("not.exist");
});

it("Should sort the table by clicking on the column headers, while filters are on", () => {
    filterByStatus("Draft");
    cy.get("button").contains("Filter").click();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".portfolios-combobox__control")
        .click()
        .get(".portfolios-combobox__menu")
        .find(".portfolios-combobox__option")
        .contains("Child Welfare Research")
        .click();

    cy.get("button").contains("Apply").click();
    // Sort by bli id ALL_BUDGET_LINES_TABLE_HEADINGS
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[0].value}]`).click();
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "16012");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15991");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15948");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[0].value}]`).click();
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15043");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15079");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15169");

    // Sort by services component
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[2].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15043");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15436");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15520");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[2].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15710");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15373");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15285");

    // Sort by date needed
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[3].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15392");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15285");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15319");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[3].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15868");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15413");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15517");

    // Sort by fiscal year
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[4].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15392");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15285");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15319");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[4].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15868");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15413");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15517");

    // Sort by CAN
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[5].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15792");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15392");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15271");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[5].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15847");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15797");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15492");

    // Sort by Total
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[6].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15797");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15567");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15392");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[6].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15891");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15319");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15764");

    cy.get("button").contains("Filter").click();
    cy.get("button").contains("Reset").as("reset-btn").click();
    cy.get("button").contains("Apply").click();

    // Sort by Agreement Name.
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[1].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "16017");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "16013");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "16014");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[1].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15776");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15001");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15980");

    // Sort by Status
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[7].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15691");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15424");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15884");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[7].value}]`).click();
    cy.wait(2000);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15776");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15001");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15003");
});

/**
 * Helper function to filter by status
 * @param {string} status - The status to filter by
 */
const filterByStatus = (status) => {
    cy.get("button").contains("Filter").click();
    cy.get("button").contains("Reset").as("reset-btn").click();

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".bli-status-combobox__control")
        .click()
        .get(".bli-status-combobox__menu")
        .find(".bli-status-combobox__option")
        .contains(status)
        .click();

    cy.get("button").contains("Apply").click();
};
