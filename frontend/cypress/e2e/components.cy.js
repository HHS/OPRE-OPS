// TODO: add Cypress component testing to project
/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("modal management", () => {
    it("should open and close modal with cancel button", () => {
        fireModal();
        cy.get(".usa-modal button").contains("Cancel").click(); // close modal
        cy.get(".usa-modal").should("not.exist");
    });
    it("should open and close modal with clicking background", () => {
        fireModal();
        cy.get(".usa-modal-overlay").click({ force: true }); // close modal
        cy.get(".usa-modal").should("not.exist");
    });
    it("should open and close modal with esc key", () => {
        fireModal();
        cy.get("body").type("{esc}"); // close modal
        cy.get(".usa-modal").should("not.exist");
    });
});

describe("procurement shop select", () => {
    it("should display all shops in the dropdown", () => {
        getToProcurementShopSelect();
        // Step Two - Select Procurement Shop
        cy.get("#procurement-shop-select option").should("have.length", 5);
    });
    it("should default to GCS", () => {
        getToProcurementShopSelect();
        // Step Two - Select Procurement Shop
        cy.get("#procurement-shop-select").should("have.value", "2");
        cy.get('[data-cy="fee"]').contains("0");
    });
});

describe("table row", () => {
    it("hover on table row displays icons", () => {
        cy.visit("/agreements/1/budget-lines?mode=edit");
        cy.get("tbody").find("tr").first().find('[data-cy="expand-row"]').should("exist");
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').should("exist");
        cy.get("tbody").find("tr").first().find('[data-cy="delete-row"]').should("exist");
        cy.get("tbody").find("tr").first().find('[data-cy="duplicate-row"]').should("exist");
    });
});

describe("accordion", () => {
    it("accordion should close when clicked", () => {
        cy.visit("/agreements/approve/1");
        cy.get(".usa-accordion__heading > .usa-accordion__button").first().as("acc-btn").should("exist");
        cy.get(".usa-accordion__content").should("not.be.hidden");
        cy.get("@acc-btn").click();
        cy.get(".usa-accordion__content").should("be.hidden");
    });

    it("accordion should close via keyboard enter", () => {
        cy.visit("/agreements/approve/1");
        cy.get(".usa-accordion__heading > .usa-accordion__button").first().as("acc-btn").should("exist");
        cy.get(".usa-accordion__content").should("not.be.hidden");
        cy.get("@acc-btn").type("{enter}");
        cy.get(".usa-accordion__content").should("be.hidden");
    });
});

const fireModal = () => {
    cy.visit("/projects/create");
    cy.get("#cancel").click(); // open modal
    cy.get(".usa-modal").should("exist");
};

const getToProcurementShopSelect = () => {
    cy.visit("/agreements/create");
    cy.get("#project-combobox-input").type("Human Services Interoperability Support{enter}");
    cy.get("#continue").click();
};
