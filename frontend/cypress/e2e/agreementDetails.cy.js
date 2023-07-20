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

it("loads with details", () => {
    cy.get("h1").should("have.text", "Contract #1: African American Child and Family Research Center");
    cy.get("h2").first().should("have.text", "Human Services Interoperability Support");
    cy.get('.DetailsTabs_listItemSelected__yQh13').should("have.text", "Agreement Details");
    cy.get("h2").eq(2).should("have.text", "Agreement Details");
    cy.get("h2").eq(1).should("have.text", "Agreement Summary");
    cy.get(':nth-child(1) > :nth-child(1) > article > .margin-0').should("have.text", "Total Budget Lines")
    cy.get('[data-cy="details-left-col"] > :nth-child(1) > .text-base-dark').should("have.text", "Description");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(1)').should("have.text", "Agreement Type")
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(2) > .font-12px').should("have.text", "Contract ")
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(3)').should("have.text", "Product Service Code")
});
