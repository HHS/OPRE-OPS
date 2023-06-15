/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/cans");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("modal management", () => {
    it("should open and close modal with cancel button", () => {
        cy.visit("/projects/create");
        cy.get("#cancel").click(); // open modal
        cy.get(".usa-modal").should("exist");
        cy.get(".usa-modal button").contains("Cancel").click(); // close modal
        cy.get(".usa-modal").should("not.exist");
    });
    it("should open and close modal with clicking background", () => {
        cy.visit("/projects/create");
        cy.get("#cancel").click(); // open modal
        cy.get(".usa-modal").should("exist");
        cy.get(".usa-modal-overlay").click({ force: true }); // close modal
        cy.get(".usa-modal").should("not.exist");
    });
    it("should open and close modal with esc key", () => {
        cy.visit("/projects/create");
        cy.get("#cancel").click(); // open modal
        cy.get(".usa-modal").should("exist");
        cy.get("body").type("{esc}"); // close modal
        cy.get(".usa-modal").should("not.exist");
    });
});
