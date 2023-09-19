/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/agreements/1");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("agreement loads with details", () => {
    cy.get("h1").contains("Contract #1: African American Child and Family Research Center");
    cy.get("h2").first().contains("Human Services Interoperability Support");
    cy.get('[data-cy="agreement-total-budget-lines-card-article"]').contains("Total Budget Lines");
    cy.get('[data-cy="number-of-agreements"]').contains("2");
    cy.get("h2").eq(2).contains("Agreement Details");
    cy.get("h2").eq(1).contains("Agreement Summary");

    cy.get('[data-cy="details-left-col"] > :nth-child(1) > .text-base-dark').contains("Description");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(1)').contains("Agreement Type");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(2) > .font-12px').contains("Contract");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(3)').contains("Product Service Code");
});

it("agreement loads with budget lines", () => {
    cy.get(".DetailsTabs_listItemNotSelected__Sy8MZ").click();
    cy.get("tbody").children().as("table-rows").should("have.length", 2);
});
