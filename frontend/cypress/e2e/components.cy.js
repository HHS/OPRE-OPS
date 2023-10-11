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

describe("agreement meta accordion", () => {
    it("accordion should open when clicked", () => {
        cy.visit("/agreements/approve/1");
        cy.get(".usa-accordion__heading > .usa-accordion__button").first().as("acc-btn").should("exist");
        cy.get(".usa-accordion__content").should("not.be.hidden");
        cy.get("@acc-btn").click();
        cy.get(".usa-accordion__content").should("be.hidden");
    });

    it("accordion should open via keyboard enter", () => {
        cy.visit("/agreements/approve/1");
        cy.get(".usa-accordion__heading > .usa-accordion__button").first().as("acc-btn").should("exist");
        cy.get(".usa-accordion__content").should("not.be.hidden");
        cy.get("@acc-btn").type("{enter}");
        cy.get(".usa-accordion__content").should("be.hidden");
    });
});

describe("agreement action accordion", () => {
    it('accordion should open when "enter" is pressed', () => {
        cy.visit("/agreements/approve/1");
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get(".usa-accordion__content").should("not.be.hidden");
        cy.get("@acc-btn").type("{enter}");
        cy.get(".usa-accordion__content").should("be.hidden");
    });

    it("should have draft option available on agreement one", () => {
        cy.visit("/agreements/approve/1");
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get("@acc-btn").type("{enter}");
        cy.get('input[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("be.disabled");
    });

    it("should have planned option available on agreement nine", () => {
        cy.visit("/agreements/approve/9");
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get("@acc-btn").type("{enter}");
        cy.get('input[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("be.disabled");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("not.be.disabled");
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
