/// <reference types="cypress" />
import { testLogin } from "./utils";
import { All_BUDGET_LINES_TABLE_HEADINGS_LIST } from "../../src/components/BudgetLineItems/AllBudgetLinesTable/AllBudgetLinesTable.constants";
const ALL_BLI_TOTAL = "4,833,000,096.01";
const DRAFT_BLI_TOTAL = "1,494,211,296.81";
const EXECUTING_BLI_TOTAL = "754,581,061";
const PLANNED_BLI_TOTAL = "1,453,612,061.2";
const OBLIGATED_BLI_TOTAL = "1,130,595,677";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/budget-lines");
});

// TODO: fix a11y issues
// afterEach(() => {
//     cy.injectAxe();
//     cy.checkA11y(null, null, terminalLog);
// });

it("loads", () => {
    cy.get("h1").should("have.text", "Budget Lines");
    cy.get("h2").should("have.text", "All Budget Lines");
    cy.get('[data-cy="bl-total-summary-card"]').should("exist");
    cy.get('[data-cy="bli-status-summary-card"]').should("exist");
    cy.get(".usa-table").should("exist");
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

it("filter button works as expected", () => {
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
    cy.get("[data-testid='budget-line-row-15678']").find("a").click();
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

it("Total BLI Summary Card should calculate the total amount of the budget line items by status", () => {
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
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "16014");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15993");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15950");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[0].value}]`).click();
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15045");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15081");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15171");

    // Sort by services component
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[2].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15045");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15438");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15522");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[2].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15712");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15375");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15287");

    // Sort by date needed
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[3].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15394");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15287");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15321");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[3].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15870");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15415");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15519");

    // Sort by fiscal year
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[4].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15394");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15287");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15321");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[4].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15870");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15415");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15519");

    // Sort by CAN
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[5].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15794");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15394");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15273");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[5].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15494");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15799");
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15849");

    // Sort by Total
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[6].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15569");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15799");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15262");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[6].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15893");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15321");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15766");

    cy.get("button").contains("Filter").click();
    cy.get("button").contains("Reset").as("reset-btn").click();
    cy.get("button").contains("Apply").click();

    // Sort by Agreement Name.
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[1].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "16016");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "16020");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "16019");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[1].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15777");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15001");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15980");

    // Sort by Status
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[7].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15646");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "16012");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15518");
    cy.get(`[data-cy=${All_BUDGET_LINES_TABLE_HEADINGS_LIST[7].value}]`).click();
    cy.wait(500);
    cy.get(`tbody > :nth-child(1) > [data-cy='bli-id']`).should("contain", "15627");
    cy.get(`tbody > :nth-child(2) > [data-cy='bli-id']`).should("contain", "15323");
    cy.get(`tbody > :nth-child(3) > [data-cy='bli-id']`).should("contain", "15890");
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
