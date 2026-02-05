/// <reference types="cypress" />

import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
});

describe("Procurement Tracker page", () => {
    it("Procurement tracker tab should exist and be clickable for developed agreements", () => {
        cy.visit(`/agreements/13`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("exist");
        cy.get('[data-cy="details-tab-Procurement Tracker"]').click();
        cy.get("h2").contains("Procurement Tracker");

        cy.get('[data-cy="step-indicator-0"]').should("have.class", "usa-step-indicator__segment--current");
    });
    it("Procurement tracker tab should not exist for non developed agreements", () => {
        cy.visit(`/agreements/3`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("not.exist");
    });
    it("should display message steps in a disabled/read-only state", () => {
        cy.visit(`/agreements/6/procurement-tracker`);
        cy.get('[data-cy="step-indicator-0"]').should("not.have.class", "usa-step-indicator__segment--current");
        cy.get("button")
            .contains(/Step 1 of/)
            .click();
        cy.get(".usa-checkbox__input").should("be.disabled");
    });
});

describe("Procurement Tracker Step 1", () => {
    it("Cancel the form", () => {
        cy.visit("/agreements/13/procurement-tracker");

        //Fill out the form and then cancel the task
        cy.get(".usa-checkbox__label").click();
        cy.get("#users-combobox-input").type("Amy Madigan {enter}");
        cy.get("#date-completed").type("01/01/2026");
        cy.get("#notes").type("notes for testing");
        cy.get('[data-cy="cancel-button"]').click();
        cy.get(".usa-modal__heading").should("exist");
        cy.get('[data-cy="cancel-action"]').click();
        cy.get(".usa-modal__heading").should("not.exist");
        cy.get('[data-cy="cancel-button"]').click();
        cy.get(".usa-modal__heading").should("exist");
        cy.get('[data-cy="confirm-action"]').click();
        cy.get("#users-combobox-input").should("be.disabled");
        cy.get("#date-completed").should("be.disabled");
        cy.get("#notes").should("be.disabled");
        cy.get('[data-cy="continue-btn"]').should("be.disabled");
        cy.get('[data-cy="cancel-button"]').should("be.disabled");
    });

    it("test validation", () => {
        cy.visit("/agreements/13/procurement-tracker");
        // check the checkbox to enable the form
        // all form elements besides the checkbox should be disabled
        cy.get("#users-combobox-input").should("be.disabled");
        cy.get("#date-completed").should("be.disabled");
        cy.get("#notes").should("be.disabled");
        cy.get('[data-cy="continue-btn"]').should("be.disabled");
        cy.get(".usa-checkbox__label").click();
        // select a user and then clear it to trigger validation
        cy.get("#users-combobox-input").type("Amy Madigan {enter}");
        cy.get("#users-combobox-input").clear();
        cy.get("#users-combobox-input").blur();
        cy.get("#users-combobox-input-error-message").should("have.text", "This is required information");
        // fix the user selection
        cy.get("#users-combobox-input").type("Amy Madigan {enter}");
        // enter a date and then clear it  to trigger validation
        // enter a date in a dynamic future to trigger validation in format MM/DD/YYYY
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        const month = String(futureDate.getMonth() + 1).padStart(2, "0");
        const day = String(futureDate.getDate()).padStart(2, "0");
        const year = futureDate.getFullYear();
        const futureDateString = `${month}/${day}/${year}`;
        cy.get("#date-completed").type(`${futureDateString}{enter}`);
        cy.get(".usa-error-message").should("have.text", "Date must be today or earlier");
        // enter a date with incorrect format to trigger validation
        cy.get("#date-completed").clear();
        cy.get("#date-completed").type("2040/01/01/{enter}");
        cy.get(".usa-error-message").should("have.text", "Date must be MM/DD/YYYY");
        // cancel should reset the form and validation
        cy.get('[data-cy="cancel-button"]').click();
        cy.get('[data-cy="confirm-action"]').click();
        cy.get("#users-combobox-input").should("have.value", "");
        cy.get("#date-completed").should("have.value", "");
        cy.get("#notes").should("have.value", "");
        cy.get("#users-combobox-input-error-message").should("not.exist");
        cy.get(".usa-error-message").should("not.exist");
    });

    it("Cancel button should be enabled/disabled based on checkbox state only", () => {
        cy.visit("/agreements/13/procurement-tracker");

        // Initially disabled (checkbox unchecked)
        cy.get('[data-cy="cancel-button"]').should("be.disabled");

        // Check checkbox - cancel button should be enabled even with empty form
        cy.get(".usa-checkbox__label").click();
        cy.get('[data-cy="cancel-button"]').should("not.be.disabled");

        // Cancel button should remain enabled even with validation errors
        cy.get("#date-completed").type("invalid-date");
        cy.get('[data-cy="cancel-button"]').should("not.be.disabled");

        // Uncheck checkbox - cancel button should be disabled again
        cy.get(".usa-checkbox__label").click();
        cy.get('[data-cy="cancel-button"]').should("be.disabled");
    });

    it("Complete the form and verify accordion behavior", () => {
        cy.visit("/agreements/13/procurement-tracker");

        // all form elements besides the checkbox should be disabled
        cy.get("#users-combobox-input").should("be.disabled");
        cy.get("#date-completed").should("be.disabled");
        cy.get("#notes").should("be.disabled");
        cy.get('[data-cy="continue-btn"]').should("be.disabled");
        cy.get('[data-cy="cancel-button"]').should("be.disabled");
        cy.get(".usa-checkbox__label").click();
        cy.get("#users-combobox-input").type("Amy Madigan {enter}");
        cy.get("#date-completed").type("01/01/2026");
        cy.get("#notes").type("notes for testing");
        cy.get('[data-cy="continue-btn"]').click();

        // check definition list for correct data
        cy.get("dl").within(() => {
            cy.get("dd").eq(0).should("have.text", "Amy Madigan");
            cy.get("dd").eq(1).should("have.text", "January 1, 2026");
            cy.get("dd").eq(2).should("have.text", "notes for testing");
        });

        // Verify Step 1 accordion remains open after submission
        cy.get("button")
            .contains(/Step 1 of/)
            .should("have.attr", "aria-expanded", "true");
    });
});
