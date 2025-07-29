/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("basic");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("basic user cannot edit agreements they're not associated with", () => {
    it("disables pencil icon from agreements list", () => {
        cy.wait(2500);
        cy.visit(`/agreements`);
        cy.wait(2000);
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').should("not.exist");
    });

    it("navigate to Agreement 9 and edit icon should not be visible", () => {
        cy.visit(`/agreements/9`);
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(2500);
        cy.get("#edit").should("not.exist");
    });

    it("navigate to Agreement 9 and edit button is disabled", () => {
        cy.wait(2500);
        cy.visit(`/agreements/review/9`);
        cy.wait(2500);
        cy.get("h1").contains("Something went wrong").should("exist");
    });

    it("hack url and see error alert", () => {
        cy.visit(`/agreements/edit/9`);
        cy.get(".usa-alert__body").should("exist");
        cy.get(".usa-alert__body").contains("This Agreement cannot be edited");
    });
});
