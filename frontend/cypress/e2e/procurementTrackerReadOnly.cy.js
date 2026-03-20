/// <reference types="cypress" />

import { testLogin, openTrackerStep } from "./utils";

const ACTIVE_TRACKER_AGREEMENT_ID = 13;

describe("Procurement Tracker Read-Only View for Procurement Team Role", () => {
    beforeEach(() => {
        testLogin("procurement-team");
    });

    it("should display procurement tracker tab and navigate to it", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("exist");
        cy.get('[data-cy="details-tab-Procurement Tracker"]').click();
        cy.get("h2").contains("Procurement Tracker");
        cy.get(".usa-step-indicator__segment--current").should("have.length", 1);
    });

    it("should render all step accordions with read-only styling", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        cy.get(".step-builder-accordion__heading--read-only").should("have.length.greaterThan", 0);
    });

    it("should not render form controls in step 1", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(1);

        // Verify no form controls
        cy.get(".usa-checkbox__input").should("not.exist");
        cy.get("#users-combobox-input").should("not.exist");
        cy.get("#step-1-date-completed").should("not.exist");
        cy.get("#notes").should("not.exist");
        cy.get('[data-cy="cancel-button"]').should("not.exist");
        cy.get('[data-cy="continue-btn"]').should("not.exist");

        // Verify read-only TermTag display
        cy.get("dl").should("exist");
        cy.contains("dt", "Completed By").should("exist");
        cy.contains("dt", "Date Completed").should("exist");
        cy.contains("dt", "Notes").should("exist");
    });

    it("should not render form controls in step 2", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        // Verify no form controls
        cy.get(".usa-checkbox__input").should("not.exist");
        cy.get("#users-combobox-input").should("not.exist");
        cy.get("#step-2-date-completed").should("not.exist");
        cy.get("#notes").should("not.exist");
        cy.get('[data-cy="cancel-button"]').should("not.exist");
        cy.get('[data-cy="continue-btn"]').should("not.exist");

        // Verify read-only TermTag display
        cy.get("dl").should("exist");
        cy.contains("dt", "Target Completion Date").should("exist");
        cy.contains("dt", "Completed By").should("exist");
        cy.contains("dt", "Date Completed").should("exist");
        cy.contains("dt", "Draft Solicitation Date").should("exist");
        cy.contains("dt", "Notes").should("exist");
    });

    it("should not render form controls in step 3", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        // Verify no form controls
        cy.get(".usa-checkbox__input").should("not.exist");
        cy.get("#users-combobox-input").should("not.exist");
        cy.get("#step-3-date-completed").should("not.exist");
        cy.get("#notes").should("not.exist");
        cy.get('[data-cy="cancel-button"]').should("not.exist");
        cy.get('[data-cy="continue-btn"]').should("not.exist");

        // Verify read-only TermTag display
        cy.get("dl").should("exist");
        cy.contains("dt", "Solicitation Period - Start").should("exist");
        cy.contains("dt", "Solicitation Period - End").should("exist");
        cy.contains("dt", "Completed By").should("exist");
        cy.contains("dt", "Date Completed").should("exist");
        cy.contains("dt", "Notes").should("exist");
    });

    it("should not render form controls in step 4", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(4);

        // Verify no form controls
        cy.get(".usa-checkbox__input").should("not.exist");
        cy.get("#users-combobox-input").should("not.exist");
        cy.get("#step-4-date-completed").should("not.exist");
        cy.get("#notes").should("not.exist");
        cy.get('[data-cy="cancel-button"]').should("not.exist");
        cy.get('[data-cy="continue-btn"]').should("not.exist");

        // Verify read-only TermTag display
        cy.get("dl").should("exist");
        cy.contains("dt", "Target Completion Date").should("exist");
        cy.contains("dt", "Completed By").should("exist");
        cy.contains("dt", "Date Completed").should("exist");
        cy.contains("dt", "Notes").should("exist");
    });

    it("should not render form controls in step 5", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(5);

        // Verify no form controls
        cy.get(".usa-checkbox__input").should("not.exist");
        cy.get("#users-combobox-input").should("not.exist");
        cy.get("#step-5-date-completed").should("not.exist");
        cy.get("#notes").should("not.exist");
        cy.get('[data-cy="cancel-button"]').should("not.exist");
        cy.get('[data-cy="continue-btn"]').should("not.exist");

        // Verify read-only TermTag display
        cy.get("dl").should("exist");
        cy.contains("dt", "Target Completion Date").should("exist");
        cy.contains("dt", "Completed By").should("exist");
        cy.contains("dt", "Date Completed").should("exist");
        cy.contains("dt", "Notes").should("exist");
    });
});
