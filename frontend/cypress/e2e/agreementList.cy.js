/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/agreements");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.get("h1").should("have.text", "Agreements");
});

it("navigates to the approveAgreements page when the approve button is clicked", () => {
    // hover over a row to make the approve button visible
    cy.get("tbody tr").first().trigger("mouseover");
    // click the approve svg with an id of "submit-for-approval-x" where x is the id of the agreement
    cy.get("svg[id^='submit-for-approval-']").first().click();
    cy.url().should("include", "/agreements/approve");
    cy.get("h1").should("exist");
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
    cy.get("input[id='current-fy']").click({ force: true });

    // get select element by name "project-react-select"
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".project-combobox__control")
        .click()
        .get(".project-combobox__menu")
        .find(".project-combobox__option")
        .first()
        .click();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(".project-officer-combobox__control")
        .click()
        .get(".project-officer-combobox__menu")
        .find(".project-officer-combobox__option")
        .first()
        .click();
    cy.get("#agreement_type").select("CONTRACT");
    cy.get("#procurement-shop-select").select("Product Service Center (PSC)");
    cy.get("label").contains("Planned").click({ force: true });
    cy.get("label").contains("Executing").click({ force: true });
    cy.get("label").contains("Obligated").click({ force: true });

    // click the button that has text Apply
    cy.get("button").contains("Apply").click();

    // check that the correct tags are displayed
    cy.get("div").contains("Upcoming Need By Date: Current FY").should("exist");
    cy.get("div").contains("Project: Human Services Interoperability Support").should("exist");
    cy.get("div").contains("Project Officer: Chris Fortunato").should("exist");
    cy.get("div").contains("Type: Contract").should("exist");
    cy.get("div").contains("Procurement Shop: Product Service Center").should("exist");
    cy.get("div").contains("Budget Line Status: Draft").should("exist");

    // check that the table is filtered correctly
    cy.get("div[id='agreements-table-zero-results']").should("exist");

    // reset
    cy.get("button").contains("Filter").click();
    cy.get("button").contains("Reset").click();
    cy.get("button").contains("Apply").click();

    // check that no tags are displayed
    cy.get("div").contains("Upcoming Need By Date: Current FY").should("not.exist");
    cy.get("div").contains("Project: Human Services Interoperability Support").should("not.exist");
    cy.get("div").contains("Project Officer: Chris Fortunato").should("not.exist");
    cy.get("div").contains("Type: Contract").should("not.exist");
    cy.get("div").contains("Procurement Shop: Product Service Center").should("not.exist");
    cy.get("div").contains("Budget Line Status: Draft").should("not.exist");

    // check that the table is filtered correctly
    cy.get("div[id='agreements-table-zero-results']").should("not.exist");
});

it("clicking the add agreement button takes you to the create agreement page", () => {
    cy.visit("/agreements?filter=all-agreements");
    cy.get("a").contains("Add Agreement").click();
    cy.url().should("include", "/agreements/create");
});
