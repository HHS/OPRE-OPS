/// <reference types="cypress" />

import { testLogin } from "./utils";

const ACTIVE_TRACKER_AGREEMENT_ID = 13;
const ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID = 14;

beforeEach(() => {
    testLogin("system-owner");
});

describe("Procurement Tracker page", () => {
    it("Procurement tracker tab should exist and be clickable for developed agreements", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("exist");
        cy.get('[data-cy="details-tab-Procurement Tracker"]').click();
        cy.get("h2").contains("Procurement Tracker");

        cy.get(".usa-step-indicator__segment--current").should("have.length", 1);
    });
    it("Procurement tracker tab should not exist for non developed agreements", () => {
        cy.visit(`/agreements/3`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("not.exist");
    });
    it("Agreements without executing budget lines should display the procurement tracker in a disabled/read-only state", () => {
        cy.visit(`/agreements/6/procurement-tracker`);
        cy.get('[data-cy="step-indicator-0"]').should("have.class", "usa-step-indicator__segment--current");
        cy.get("button")
            .contains(/1 of 6/)
            .click();
        cy.get(".usa-checkbox__input").should("be.disabled");
    });
});

describe("Procurement Tracker Step 1", () => {
    const openStepOne = () => {
        cy.contains("button", /1 of 6/i).then(($stepOneButton) => {
            if ($stepOneButton.attr("aria-expanded") === "false") {
                cy.wrap($stepOneButton).click();
            }
        });
    };

    it("renders completed step 1 summary state", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepOne();

        cy.contains("The pre-solicitation package has been sent to the Procurement Shop for review").should("exist");
        cy.contains("Completed By").should("exist");
        cy.contains("Date Completed").should("exist");
        cy.contains("Notes").should("exist");
        cy.get(".usa-checkbox__label").should("not.exist");
        cy.get('[data-cy="cancel-button"]').should("not.exist");
        cy.get('[data-cy="continue-btn"]').should("not.exist");
    });

    it("shows completed step 1 data fields", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepOne();
        cy.get("dl").within(() => {
            cy.get("dd").eq(0).should("not.be.empty");
            cy.get("dd").eq(1).should("not.be.empty");
            cy.get("dd").eq(2).should("not.be.empty");
        });
    });

    it("does not show editable controls when step 1 is completed", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepOne();

        cy.get(".usa-checkbox__label").should("not.exist");
        cy.get("#users-combobox-input").should("not.exist");
        cy.get("#date-completed").should("not.exist");
        cy.get("#notes").should("not.exist");
        cy.get('[data-cy="cancel-button"]').should("not.exist");
        cy.get('[data-cy="continue-btn"]').should("not.exist");
    });

    it("toggles completed step 1 accordion while preserving summary content", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepOne();

        cy.contains("button", /1 of 6/i).as("stepOneButton");
        cy.contains("The pre-solicitation package has been sent to the Procurement Shop for review").should("exist");

        cy.get("@stepOneButton").click();
        cy.get("@stepOneButton").click();
        cy.get("@stepOneButton").should("exist");
        cy.contains("The pre-solicitation package has been sent to the Procurement Shop for review").should("exist");
    });
});
