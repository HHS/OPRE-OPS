/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("basic");
    cy.visit(`/`);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("disables pencil icon from agreements list", () => {
    cy.visit(`/agreements`);
    cy.get("tbody").find("tr").first().trigger("mouseover");
    cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').should("not.exist");
});

it("select first agreement and edit icon should not be visible", () => {
    cy.visit(`/agreements/1`);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get("#edit").should("not.exist");
});

it("review first agreement and edit button is disabled", () => {
    cy.visit(`/agreements/review/1`);
    cy.get('[data-cy="edit-agreement-btn"]').should("be.disabled");
});

it("hack url and see error alert", () => {
    cy.visit(`/agreements/edit/1`);
    cy.get(".usa-alert__body").should("exist");
    cy.get(".usa-alert__body").contains("This Agreement cannot be edited");
});
