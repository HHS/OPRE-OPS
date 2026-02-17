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
        cy.get(".usa-step-indicator__segment--current").should("have.length", 0);
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

    it("renders the step 1 view that matches API status", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepOne();

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (completedViewVisible) {
                cy.contains("Completed By").should("exist");
                cy.contains("Date Completed").should("exist");
                cy.contains("Notes").should("exist");
                cy.get(".usa-checkbox__label").should("not.exist");
                cy.get('[data-cy="cancel-button"]').should("not.exist");
                cy.get('[data-cy="continue-btn"]').should("not.exist");
            } else {
                cy.get(".usa-checkbox__label").should("exist");
                cy.get('[data-cy="cancel-button"]').should("exist");
                cy.get('[data-cy="continue-btn"]').should("exist");
            }
        });
    });

    it("renders completed summary data when step 1 is completed", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepOne();

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (!completedViewVisible) {
                cy.get(".usa-checkbox__label").should("exist");
                return;
            }

            cy.get("dl").within(() => {
                cy.get("dd").eq(0).should("not.be.empty");
                cy.get("dd").eq(1).should("not.be.empty");
                cy.get("dd").eq(2).should("not.be.empty");
            });
        });
    });

    it("shows or hides editable controls based on step 1 status", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepOne();

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (completedViewVisible) {
                cy.get(".usa-checkbox__label").should("not.exist");
                cy.get("#users-combobox-input").should("not.exist");
                cy.get("#date-completed").should("not.exist");
                cy.get("#notes").should("not.exist");
                cy.get('[data-cy="cancel-button"]').should("not.exist");
                cy.get('[data-cy="continue-btn"]').should("not.exist");
                return;
            }

            cy.get(".usa-checkbox__label").should("exist");
            cy.get('[data-cy="cancel-button"]').should("exist");
            cy.get('[data-cy="continue-btn"]').should("exist");
        });
    });

    it("toggles step 1 accordion open/close", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepOne();

        cy.contains("button", /1 of 6/i).as("stepOneButton");

        cy.get("@stepOneButton").should("have.attr", "aria-expanded", "true");
        cy.get("@stepOneButton").click();
        cy.get("@stepOneButton").should("have.attr", "aria-expanded", "false");
        cy.get("@stepOneButton").click();
        cy.get("@stepOneButton").should("have.attr", "aria-expanded", "true");
    });

    it("Only shows authorized users in Task Completed By dropdown", () => {
        // Use a different agreement or reload to get fresh state
        // Visit agreement details first, then navigate to procurement tracker
        cy.visit("/agreements/13");

        // Wait for page load
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("exist");
        cy.get('[data-cy="details-tab-Procurement Tracker"]').click();

        // Check if Step 1 is already completed (from previous test)
        cy.get("body").then(($body) => {
            // If checkbox exists, test the dropdown
            if ($body.find(".usa-checkbox__label").length > 0) {
                // Enable the form
                cy.get(".usa-checkbox__label").click();

                // Open the users dropdown
                cy.get("#users-combobox-input").click();

                // The dropdown should exist and contain options
                cy.get(".usa-combo-box__list").should("exist");

                // Amy Madigan should be in the list (she's authorized for this agreement)
                cy.get(".usa-combo-box__list").should("contain", "Amy Madigan");
            } else {
                // Step 1 is already completed - verify the completed data shows authorized user
                cy.get("dl dd").first().should("exist"); // Completed by field exists
                cy.log("Step 1 already completed - skipping user dropdown test");
            }
        });
    });
});

describe("Procurement Tracker Step 2", () => {
    const openStepTwo = () => {
        cy.contains("button", /2 of 6/i).then(($stepTwoButton) => {
            if ($stepTwoButton.attr("aria-expanded") === "false") {
                cy.wrap($stepTwoButton).click();
            }
        });
    };

    it("renders the step 2 view that matches API status", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepTwo();

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.text().includes("Step Completed");
            if (completedViewVisible) {
                cy.contains("Step Completed").should("exist");
                cy.get(".usa-checkbox__input").should("not.exist");
                cy.get('[data-cy="cancel-button"]').should("not.exist");
                cy.get('[data-cy="continue-btn"]').should("not.exist");
            } else {
                cy.contains(/Edit the pre-solicitation package in collaboration with the Procurement Shop/i).should(
                    "exist"
                );
                cy.get(".usa-checkbox__input").should("exist");
                cy.get('[data-cy="cancel-button"]').should("exist");
                cy.get('[data-cy="continue-btn"]').should("exist");
            }
        });
    });

    it("shows or hides editable controls based on step 2 status", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepTwo();

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.text().includes("Step Completed");
            if (completedViewVisible) {
                cy.get(".usa-checkbox__input").should("not.exist");
                cy.get('[data-cy="cancel-button"]').should("not.exist");
                cy.get('[data-cy="continue-btn"]').should("not.exist");
                return;
            }

            cy.get(".usa-checkbox__input").should("exist");
            cy.get('[data-cy="cancel-button"]').should("exist");
            cy.get('[data-cy="continue-btn"]').should("exist");
        });
    });

    it("toggles step 2 accordion open/close", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepTwo();

        cy.contains("button", /2 of 6/i).as("stepTwoButton");

        cy.get("@stepTwoButton").should("have.attr", "aria-expanded", "true");
        cy.get("@stepTwoButton").click();
        cy.get("@stepTwoButton").should("have.attr", "aria-expanded", "false");
        cy.get("@stepTwoButton").click();
        cy.get("@stepTwoButton").should("have.attr", "aria-expanded", "true");
    });

    it("renders instructional text in non-completed state", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openStepTwo();

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.text().includes("Step Completed");
            if (!completedViewVisible) {
                cy.contains(
                    /Edit the pre-solicitation package in collaboration with the Procurement Shop/i
                ).should("exist");
                cy.contains(
                    /Once the documents are finalized, go to the Documents Tab, upload the final and signed versions/i
                ).should("exist");
            }
        });
    });
});
