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

it("the agreements have the correct status", () => {
    cy.get("tbody").children().as("table-rows");

    cy.get("@table-rows")
        .should("contain", "Contract #1: African American Child and Family Research Center")
        .and("contain", "Draft");

    cy.get("@table-rows")
        .should("contain", "DIRECT ALLOCATION #2: African American Child and Family Research Center")
        .and("contain", "Planned");

    cy.get("@table-rows").should("contain", "MIHOPE Check-In").and("contain", "Obligated");

    cy.get("@table-rows").should("contain", "MIHOPE Long-Term").and("contain", "Obligated");

    cy.get("@table-rows")
        .should("contain", "Grant #1: Early Care and Education Leadership Study (ExCELS)")
        .and("contain", "Draft");

    cy.get("@table-rows")
        .should("contain", "IAA #1: Early Care and Education Leadership Study (ExCELS)")
        .and("contain", "Draft");

    cy.get("@table-rows").should("contain", "IAA-AA #1: Fathers and Continuous Learning (FCL)").and("contain", "Draft");

    cy.get("@table-rows")
        .should("contain", "CONTRACT #2: Fathers and Continuous Learning (FCL)")
        .and("contain", "Draft");
});
