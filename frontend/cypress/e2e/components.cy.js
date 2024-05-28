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
        cy.visit("/agreements/review/1");
        cy.get(".usa-accordion__heading > .usa-accordion__button").first().as("acc-btn").should("exist");
        cy.get(".usa-accordion__content").should("not.be.hidden");
        cy.get("@acc-btn").click();
        cy.get(".usa-accordion__content").should("be.hidden");
    });

    it("accordion should close via keyboard enter", () => {
        cy.visit("/agreements/review/1");
        cy.get(".usa-accordion__heading > .usa-accordion__button").first().as("acc-btn").should("exist");
        cy.get(".usa-accordion__content").should("not.be.hidden");
        cy.get("@acc-btn").focus();
        cy.get("@acc-btn").type("{enter}");
        cy.get(".usa-accordion__content").should("be.hidden");
    });
});

describe("DatePicker", () => {
    it("should error if date is not in the future", () => {
        cy.visit("/agreements/1/budget-lines");
        cy.get("#edit").click();
        cy.get("#need-by-date").as("need-by-date");
        cy.get("@need-by-date").type("01/01/2020");
        cy.get("@need-by-date").blur();
        cy.get(".usa-error-message").should("exist");
        cy.get("#add-budget-line").should("be.disabled");
        cy.get("@need-by-date").clear();
        cy.get("@need-by-date").type("01/01/2048");
        cy.get("@need-by-date").blur();
        cy.get(".usa-error-message").should("not.exist");
        cy.get("#add-budget-line").should("not.be.disabled");
    });
    it('should error if date is not in the format "MM/DD/YYYY"', () => {
        cy.visit("/agreements/1/budget-lines");
        cy.get("#edit").click();
        cy.get("#need-by-date").as("need-by-date");
        cy.get("@need-by-date").type("01/01/20");
        cy.get("@need-by-date").blur();
        cy.get(".usa-error-message").should("exist");
        cy.get("#add-budget-line").should("be.disabled");
        cy.get("@need-by-date").clear();
        cy.get("@need-by-date").type("01/01/2048");
        cy.get("@need-by-date").blur();
        cy.get(".usa-error-message").should("not.exist");
        cy.get("#add-budget-line").should("not.be.disabled");
        cy.get("@need-by-date").clear();
        cy.get("@need-by-date").type("tacocat");
        cy.get("@need-by-date").blur();
        cy.get(".usa-error-message").should("exist");
        cy.get("#add-budget-line").should("be.disabled");
        cy.get("@need-by-date").clear();
        cy.get("@need-by-date").type("01/01/2048");
        cy.get("@need-by-date").blur();
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
        cy.get("#pop-start-date").type("01/01/2020");
        cy.get("#pop-start-date").blur();
        cy.get("#pop-end-date").type("01/01/2010");
        cy.get("#pop-end-date").blur();
        cy.get('[data-cy="add-services-component-btn"]').click();
        cy.get("h2").contains("Services Component 4").should("not.exist");
    });
    it('should error if date is not in the format "MM/DD/YYYY"', () => {
        cy.visit("/agreements/1/budget-lines");
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
