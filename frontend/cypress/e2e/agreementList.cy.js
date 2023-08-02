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

it("clicking the filter button opens the filter", () => {
    cy.visit("/agreements?filter=all-agreements");
    cy.get("button").contains("Filter").click();
});
