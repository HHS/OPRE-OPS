// TODO: consider Cypress component testing to project
/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("DatePicker", () => {
    it("should display date picker", () => {
        cy.visit("/agreements/1/budget-lines");
        cy.get("#edit").click();
        cy.get("#need-by-date").should("exist");
    });

    it("should error if date is not in the future", () => {
        cy.visit("/agreements/1/budget-lines");
        cy.get("#edit").click();
        cy.get("#need-by-date").as("need-by-date").type("01/01/2020").blur();
        cy.get(".usa-error-message").should("exist");
        cy.get("#add-budget-line").should("be.disabled");
        cy.get("@need-by-date").clear();
        cy.get("@need-by-date").type("01/01/2048").blur();
        cy.get(".usa-error-message").should("not.exist");
        cy.get("#add-budget-line").should("not.be.disabled");
    });
    it('should error if date is not in the format "MM/DD/YYYY"', () => {
        cy.visit("/agreements/1/budget-lines");
        cy.get("#edit").click();
        cy.get("#need-by-date").as("need-by-date").type("01/01/20").blur();
        cy.get(".usa-error-message").should("exist");
        cy.get("#add-budget-line").should("be.disabled");
        cy.get("@need-by-date").clear();
        cy.get("@need-by-date").type("01/01/2048").blur();
        cy.get(".usa-error-message").should("not.exist");
        cy.get("#add-budget-line").should("not.be.disabled");
        cy.get("@need-by-date").clear();
        cy.get("@need-by-date").type("tacocat").blur();
        cy.get(".usa-error-message").should("exist");
        cy.get("#add-budget-line").should("be.disabled");
        cy.get("@need-by-date").clear();
        cy.get("@need-by-date").type("01/01/2048").blur();
        cy.get(".usa-error-message").should("not.exist");
        cy.get("#add-budget-line").should("not.be.disabled");
    });
});

describe("DateRangePicker", () => {
    it("should display date range picker", () => {
        cy.visit("/agreements/1/budget-lines");
        cy.get("#edit").click();
        cy.get("#pop-start-date").should("exist");
        cy.get("#pop-end-date").should("exist");
    });

    it("should error if end date is not before the start date", () => {
        cy.visit("/agreements/1/budget-lines");
        cy.get("#edit").click();
        cy.get("#servicesComponentSelect").select("4");
        cy.get("#pop-start-date").type("01/01/2020").blur();
        cy.get("#pop-end-date").type("01/01/2010").blur();
        cy.get('[data-cy="add-services-component-btn"]').click();
        cy.get("h2").contains("Services Component 4").should("not.exist");
    });
    it('should error if date is not in the format "MM/DD/YYYY"', () => {
        cy.visit("/agreements/1/budget-lines");
        cy.get("#edit").click();
        cy.get("#servicesComponentSelect").select("4");
        cy.get("#pop-start-date").type("tacocat").blur();
        cy.get('[data-cy="add-services-component-btn"]').click();
        cy.get("h2").contains("Services Component 4").should("not.exist");
        cy.get("#pop-start-date").clear();
        cy.get("#pop-start-date").type("01/01/2020").blur();
        cy.get("#pop-end-date").type("tacocat").blur();
        cy.get('[data-cy="add-services-component-btn"]').click();
        cy.get("h2").contains("Services Component 4").should("not.exist");
    });
});
