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

const fireModal = () => {
    cy.visit("/projects/create");
    cy.get("#cancel").click(); // open modal
    cy.get(".usa-modal").should("exist");
};

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

const getToProcurementShopSelect = () => {
    cy.visit("/agreements/create");
    cy.get("#project-combobox-input").type("Human Services Interoperability Support{enter}");
    cy.get("#continue").click();
};

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

it("hover on table row displays icons", () => {
    cy.visit("/agreements/1/budget-lines?mode=edit");
    cy.get("tbody").find("tr").first().find('[data-cy="expand-row"]').should("exist");
    cy.get("tbody").find("tr").first().trigger("mouseover");
    cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').should("exist");
    cy.get("tbody").find("tr").first().find('[data-cy="delete-row"]').should("exist");
    cy.get("tbody").find("tr").first().find('[data-cy="duplicate-row"]').should("exist");
});
