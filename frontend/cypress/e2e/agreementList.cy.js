/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/agreements");
});

afterEach(() => {
    cy.wait(1000);
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.get("h1").should("have.text", "Agreements");
});

it("Agreements list table has correct headers and first row", () => {
    cy.get(".usa-table").should("exist");
    cy.get("h1").should("exist");
    cy.get("h1").should("have.text", "Agreements");
    // table headers
    cy.get("thead > tr > :nth-child(1)").should("have.text", "Agreement");
    cy.get("thead > tr > :nth-child(2)").should("have.text", "Project");
    cy.get("thead > tr > :nth-child(3)").should("have.text", "Type");
    cy.get("thead > tr > :nth-child(4)").should("have.text", "Agreement Total");
    cy.get("thead > tr > :nth-child(5)").should("have.text", "Next Budget Line");
    cy.get("thead > tr > :nth-child(6)").should("have.text", "Next Obligate By");

    // select the row with data-testid="agreement-table-row-1"
    cy.get("[data-testid='agreement-table-row-1']").should("exist");

    // first row (including tooltips)
    cy.get(
        "tbody > [data-testid='agreement-table-row-1'] > :nth-child(1) > a > .usa-tooltip > .usa-tooltip__trigger"
    ).should("have.text", "Contract #1: African American Child and Family Research Center");
    cy.get(
        "tbody > [data-testid='agreement-table-row-1'] > :nth-child(1) > a > .usa-tooltip > .usa-tooltip__body"
    ).should("have.text", "Contract #1: African American Child and Family Research Center");
    cy.get(
        "tbody > [data-testid='agreement-table-row-1'] > :nth-child(2) > .usa-tooltip > .usa-tooltip__trigger"
    ).should("have.text", "Human Services Interoperability Support");
    cy.get("tbody > [data-testid='agreement-table-row-1'] > :nth-child(2) > .usa-tooltip > .usa-tooltip__body").should(
        "have.text",
        "Human Services Interoperability Support"
    );
    cy.get("tbody > [data-testid='agreement-table-row-1'] > :nth-child(3)").should("have.text", "Contract");
    cy.get("tbody > [data-testid='agreement-table-row-1'] > :nth-child(4)").should("have.text", "$0");
    cy.get("tbody > [data-testid='agreement-table-row-1'] > :nth-child(5)").should("have.text", "$0");
    cy.get("tbody > [data-testid='agreement-table-row-1'] > :nth-child(6)").should("have.text", "None");

    cy.get("[data-testid='agreement-table-row-1']").trigger("mouseover");
    cy.get("button[id^='submit-for-approval-']").first().should("exist");
    cy.get("button[id^='submit-for-approval-']").first().should("not.be.disabled");

    // expand first row
    cy.get(':nth-child(1) > :nth-child(7) > [data-cy="expand-row"]').should("exist");
    cy.get(':nth-child(1) > :nth-child(7) > [data-cy="expand-row"]').click();
    cy.get(".padding-right-9 > :nth-child(1) > :nth-child(1)").should("have.text", "Created By");
    cy.get(".width-mobile > .text-base-dark").should("have.text", "Description");
    cy.get('[style="margin-left: 3.125rem;"] > .text-base-dark').should("have.text", "Budget Lines");
});

it("navigates to the ReviewAgreements page when the review button is clicked", () => {
    cy.get(".usa-table").should("exist");
    cy.get("[data-testid='agreement-table-row-1']").trigger("mouseover");
    cy.get("button[id^='submit-for-approval-']").first().should("exist");
    cy.get("button[id^='submit-for-approval-']").first().should("not.be.disabled");
    cy.get("button[id^='submit-for-approval-']").first().click();
    cy.url().should("include", "/agreements/review");
    cy.get("h1").should("exist");
    cy.get("h1").should("have.text", "Request BL Status Change");
});

it("Agreements Table is correctly filtered on all-agreements or my-agreements", () => {
    cy.visit("/agreements?filter=all-agreements");
    cy.get("tbody").children().should("have.length.at.least", 1);

    cy.visit("/agreements?filter=my-agreements");
    cy.get("tbody").children().should("have.length.at.least", 1);
});

it("the filter button works as expected", () => {
    cy.visit("/agreements?filter=all-agreements");
    cy.get("button").contains("Filter").click();

    // set a number of filters
    // get select element by name "project-react-select"
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".fiscal-year-combobox__control")
        .click()
        .get(".fiscal-year-combobox__menu")
        .find(".fiscal-year-combobox__option")
        .first()
        .click();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".portfolios-combobox__control")
        .click()
        .get(".portfolios-combobox__menu")
        .find(".portfolios-combobox__option")
        .first()
        .click();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".bli-status-combobox__control")
        .click()
        .get(".bli-status-combobox__menu")
        .find(".bli-status-combobox__option")
        .first()
        .click();

    // click the button that has text Apply
    cy.get("button").contains("Apply").click();

    // check that the correct tags are displayed
    cy.get("div").contains("FY 2044").should("exist");
    cy.get("div").contains("Child Welfare Research").should("exist");
    cy.get("div").contains("Draft").should("exist");

    // check that the table is filtered correctly
    cy.get("div[id='agreements-table-zero-results']").should("exist");

    // reset
    cy.get("button").contains("Filter").click();
    cy.get("button").contains("Reset").click();
    cy.get("button").contains("Apply").click();

    // check that no tags are displayed
    cy.get("div").contains("FY 2044").should("not.exist");
    cy.get("div").contains("Child Welfare Research").should("not.exist");
    cy.get("div").contains("Planned").should("not.exist");

    // check that the table is filtered correctly
    cy.get("div[id='agreements-table-zero-results']").should("not.exist");
});

it("clicking the add agreement button takes you to the create agreement page", () => {
    cy.visit("/agreements?filter=all-agreements");
    cy.get("a").contains("Add Agreement").click();
    cy.url().should("include", "/agreements/create");
});

it("Change Requests tab works", () => {
    cy.visit("/agreements?filter=change-requests");
    cy.get(":nth-child(1) > .margin-0").should("have.text", "For Review");
    cy.get(".text-center")
        .invoke("text")
        .should("match", /no changes/i);
});
