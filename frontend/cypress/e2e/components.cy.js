// TODO: consider Cypress component testing to project
/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/agreements/9/budget-lines");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("DateRangePicker", () => {
    it("should error if end date is not before the start date", () => {
        cy.get("#edit").click();
        cy.get("#servicesComponentSelect").select("4");
        cy.get("#pop-start-date").type("01/01/2020");
        cy.get("#pop-start-date").blur();
        cy.get("#pop-end-date").type("01/01/2010");
        cy.get("#pop-end-date").blur();
        cy.get('[data-cy="add-services-component-btn"]').click();
        cy.get("h2").contains("Services Component 4").should("not.exist");
    });
    it('should error if date is not in the format "MM/DD/YYYY"', () => {
        cy.get("#edit").click();
        cy.get("#servicesComponentSelect").select("4");
        cy.get("#pop-start-date").type("tacocat");
        cy.get("#pop-start-date").blur();
        cy.get('[data-cy="add-services-component-btn"]').click();
        cy.get("h2").contains("Services Component 4").should("not.exist");
        cy.get("#pop-start-date").clear();
        cy.get("#pop-start-date").type("01/01/2020");
        cy.get("#pop-start-date").blur();
        cy.get("#pop-end-date").type("tacocat");
        cy.get("#pop-end-date").blur();
        cy.get('[data-cy="add-services-component-btn"]').click();
        cy.get("h2").contains("Services Component 4").should("not.exist");
    });
});
