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
    cy.get("tbody").children().as("table-rows").should("have.length", 8);

    cy.get("@table-rows").eq(0).should("contain", "Draft");
    cy.get("@table-rows").eq(1).should("contain", "Planned");
    cy.get("@table-rows").eq(2).should("contain", "Obligated");
    cy.get("@table-rows").eq(3).should("contain", "Obligated");
    cy.get("@table-rows").eq(4).should("contain", "Draft");
    cy.get("@table-rows").eq(5).should("contain", "Draft");
    cy.get("@table-rows").eq(6).should("contain", "Draft");
    cy.get("@table-rows").eq(7).should("contain", "Draft");
});
