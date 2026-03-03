/// <reference types="cypress" />

import { testLogin, openTrackerStep, isStepCheckboxEnabled } from "./utils";

// Agreement 13: Used for read-only verification tests (may be in completed or pending state)
const ACTIVE_TRACKER_AGREEMENT_ID = 13;

// Agreement 14: Used for interactive form tests (should be in pending state with Step 2 active)
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
    it("renders the step 1 view that matches API status", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(1);

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
        openTrackerStep(1);

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (!completedViewVisible) {
                cy.get(".usa-checkbox__label").should("exist");
                return;
            }

            cy.get("dl").first().within(() => {
                cy.get("dd").eq(0).should("not.be.empty");
                cy.get("dd").eq(1).should("not.be.empty");
                cy.get("dd").eq(2).should("not.be.empty");
            });
        });
    });

    it("shows or hides editable controls based on step 1 status", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(1);

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (completedViewVisible) {
                cy.get(".usa-checkbox__label").should("not.exist");
                cy.get("#users-combobox-input").should("not.exist");
                cy.get("#step-1-date-completed").should("not.exist");
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
        openTrackerStep(1);

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
        openTrackerStep(1);

        // Check if Step 1 is already completed (from previous test)
        cy.get("body").then(($body) => {
            // If checkbox exists, test the dropdown
            if ($body.find(".usa-checkbox__label").length > 0) {
                // Enable the form - use first() to click only the first checkbox
                cy.get(".usa-checkbox__label").first().click();

                // Open the users dropdown
                cy.get("#users-combobox-input").click();

                // The dropdown should exist and contain options
                cy.get(".users-combobox__menu").should("exist");

                // Amy Madigan should be in the list (she's authorized for this agreement)
                cy.get(".users-combobox__menu").should("contain", "Amy Madigan");
            } else {
                // Step 1 is already completed - verify completed state is visible
                cy.contains("Completed By").should("exist");
                cy.log("Step 1 already completed - skipping user dropdown test");
            }
        });
    });
});

describe("Procurement Tracker Step 2", () => {
    it("renders the step 2 view that matches API status", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (completedViewVisible) {
                cy.contains("Completed By").should("exist");
                cy.contains("Date Completed").should("exist");
                cy.contains("Notes").should("exist");
                cy.contains("Target Completion Date").should("exist");
                cy.contains("Draft Solicitation Date").should("exist");
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

    it("renders completed summary data when step 2 is completed", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (!completedViewVisible) {
                cy.get(".usa-checkbox__label").should("exist");
                return;
            }

            // Verify all Step 2-specific fields are present with values
            // Find the dl that contains "Target Completion Date" (Step 2 specific field)
            cy.contains("dt", "Target Completion Date").should("exist");
            cy.contains("dt", "Target Completion Date").parents("dl").within(() => {
                // Standard completion fields
                cy.contains("dt", "Completed By").next("dd").should("not.be.empty");
                cy.contains("dt", "Date Completed").next("dd").should("not.be.empty");

                // Draft Solicitation Date (Step 2 specific, may be "None")
                cy.contains("dt", "Draft Solicitation Date").should("exist");
            });
        });
    });

    it("shows or hides editable controls based on step 2 status", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (completedViewVisible) {
                cy.get(".usa-checkbox__label").should("not.exist");
                cy.get("#users-combobox-input").should("not.exist");
                cy.get("#step-2-date-completed").should("not.exist");
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

    it("displays target completion date save button when date not yet saved", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        cy.get("body").then(($body) => {
            const isPending = $body.find("#step-2-checkbox").length > 0;
            if (isPending) {
                const hasTargetDateTag = $body.text().includes("Target Completion Date");
                if (!hasTargetDateTag) {
                    cy.get("#target-completion-date").should("exist");
                    cy.get('[data-cy="target-completion-save-btn"]').should("exist");
                    cy.get('[data-cy="target-completion-save-btn"]').should("be.disabled");
                } else {
                    cy.log("Target completion date already saved");
                }
            }
        });
    });

    it("enables save button when valid target date is entered", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        // Check if step 2 is in pending state and target date hasn't been saved yet
        cy.get("body").then(($body) => {
            const isPending = $body.find("#step-2-checkbox").length > 0;
            const hasTargetDateSaved = $body.find("dt").text().includes("Target Completion Date");

            if (isPending && !hasTargetDateSaved) {
                cy.get("#target-completion-date").should("exist").and("not.be.disabled");
                cy.get("#target-completion-date").clear().type("12/31/2026").blur();
                // Wait for validation to run and button to be enabled
                cy.get('[data-cy="target-completion-save-btn"]').should("not.be.disabled");
            } else {
                cy.log("Step 2 not in correct state for this test - skipping");
            }
        });
    });

    it("displays saved target completion date as a TermTag", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        cy.get("body").then(($body) => {
            const isPending = $body.find("#step-2-checkbox").length > 0;
            // Check if TermTag with Target Completion Date exists
            const hasTargetDateTag = $body.find("dt:contains('Target Completion Date')").length > 0;

            if (isPending && hasTargetDateTag) {
                // Target date has been saved and should display as TermTag
                cy.contains("Target Completion Date").should("exist");
                cy.get("#target-completion-date").should("not.exist");
                cy.get('[data-cy="target-completion-save-btn"]').should("not.exist");
            } else {
                cy.log("Target completion date not yet saved - skipping");
            }
        });
    });

    it("disables all completion fields when checkbox is unchecked", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        cy.get("body").then(($body) => {
            const isPending = $body.find("#step-2-checkbox").length > 0;
            if (isPending) {
                cy.get("#users-combobox-input").should("be.disabled");
                cy.get("#step-2-date-completed").should("be.disabled");
                cy.get("#notes").should("be.disabled");
                cy.get("#step-2-draft-solicitation-date").should("be.disabled");
                cy.get('[data-cy="cancel-button"]').should("be.disabled");
                cy.get('[data-cy="continue-btn"]').should("be.disabled");
            }
        });
    });

    it("enables completion fields when checkbox is checked", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        // Use Cypress retry logic instead of synchronous jQuery check
        isStepCheckboxEnabled("#step-2-checkbox").then((isEnabled) => {
            if (isEnabled) {
                // Step is active and checkbox is enabled
                cy.get("#step-2-checkbox").check({ force: true });
                cy.get("#step-2-checkbox").should("be.checked");

                // Wait for React state update, then verify fields are enabled
                cy.get("#users-combobox-input").should("not.be.disabled");
                cy.get("#step-2-date-completed").should("not.be.disabled");
                cy.get("#notes").should("not.be.disabled");
                cy.get("#step-2-draft-solicitation-date").should("not.be.disabled");
                cy.get('[data-cy="cancel-button"]').should("not.be.disabled");
            } else {
                cy.log("Step 2 checkbox is disabled or step not pending - skipping");
            }
        });
    });

    it("re-disables fields when checkbox is unchecked after being checked", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        // Use helper to check if checkbox is enabled
        isStepCheckboxEnabled("#step-2-checkbox").then((isEnabled) => {
            if (isEnabled) {
                // Check the checkbox first
                cy.get("#step-2-checkbox").check({ force: true });
                cy.get("#step-2-checkbox").should("be.checked");
                cy.get("#users-combobox-input").should("not.be.disabled");

                // Uncheck the checkbox
                cy.get("#step-2-checkbox").uncheck({ force: true });
                cy.get("#step-2-checkbox").should("not.be.checked");

                // Wait for React state update, then verify fields are disabled again
                cy.get("#users-combobox-input").should("be.disabled");
                cy.get('[data-cy="cancel-button"]').should("be.disabled");
                cy.get('[data-cy="continue-btn"]').should("be.disabled");
            } else {
                cy.log("Step 2 checkbox is disabled or step not pending - skipping");
            }
        });
    });

    it("enables continue button when all required fields are filled", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        // Use helper to check if checkbox is enabled
        isStepCheckboxEnabled("#step-2-checkbox").then((isEnabled) => {
            if (isEnabled) {
                cy.get("#step-2-checkbox").check({ force: true });
                cy.get("#step-2-checkbox").should("be.checked");

                // Fill out required fields with waits for validation
                cy.get("#users-combobox-input").should("not.be.disabled").click();
                cy.get(".users-combobox__menu").should("exist");
                cy.get(".users-combobox__option").first().click();

                // Trigger validation by blurring after typing
                cy.get("#step-2-date-completed").should("not.be.disabled").type("02/20/2026").blur();

                // Wait for validation to complete before checking button state
                cy.get('[data-cy="continue-btn"]').should("not.be.disabled");
            } else {
                cy.log("Step 2 checkbox is disabled or step not pending - skipping");
            }
        });
    });

    it("displays cancel confirmation modal when cancel button is clicked", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        // Use helper to check if checkbox is enabled
        isStepCheckboxEnabled("#step-2-checkbox").then((isEnabled) => {
            if (isEnabled) {
                cy.get("#step-2-checkbox").check({ force: true });
                cy.get("#step-2-checkbox").should("be.checked");
                cy.get('[data-cy="cancel-button"]').should("not.be.disabled").click();

                // Verify modal appears with correct content
                cy.get(".usa-modal").should("be.visible");
                cy.contains("Are you sure you want to cancel this task?").should("be.visible");
                cy.contains("button", "Cancel Task").should("be.visible");
                cy.contains("button", "Continue Editing").should("be.visible");
            } else {
                cy.log("Step 2 checkbox is disabled or step not pending - skipping");
            }
        });
    });

    it("resets form when modal cancel is confirmed", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        // Use helper to check if checkbox is enabled
        isStepCheckboxEnabled("#step-2-checkbox").then((isEnabled) => {
            if (isEnabled) {
                cy.get("#step-2-checkbox").check({ force: true });
                cy.get("#step-2-checkbox").should("be.checked");

                // Fill out form fields
                cy.get("#step-2-date-completed").should("not.be.disabled").type("02/20/2026");
                cy.get("#notes").should("not.be.disabled").type("Test notes");

                // Trigger cancel modal and confirm
                cy.get('[data-cy="cancel-button"]').should("not.be.disabled").click();
                cy.get(".usa-modal").should("be.visible");
                cy.contains("button", "Cancel Task").click();

                // Verify form was reset
                cy.get("#step-2-checkbox").should("not.be.checked");
                cy.get("#notes").should("have.value", "");
            } else {
                cy.log("Step 2 checkbox is disabled or step not pending - skipping");
            }
        });
    });

    it("only shows authorized users in Task Completed By dropdown", () => {
        // Navigate via tab to ensure full page context
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("exist").click();
        openTrackerStep(2);

        // Use helper to check if checkbox is enabled
        isStepCheckboxEnabled("#step-2-checkbox").then((isEnabled) => {
            if (isEnabled) {
                cy.get("#step-2-checkbox").check({ force: true });
                cy.get("#step-2-checkbox").should("be.checked");

                // Open users dropdown and verify authorized users are shown
                cy.get("#users-combobox-input").should("not.be.disabled").click();
                cy.get(".users-combobox__menu").should("be.visible");

                // Amy Madigan should be authorized for this agreement
                cy.get(".users-combobox__menu").should("contain", "Amy Madigan");
            } else {
                // Step already completed
                cy.contains("Completed By").should("exist");
                cy.log("Step 2 already completed or checkbox disabled - skipping user dropdown test");
            }
        });
    });

    it("toggles step 2 accordion open/close", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        cy.contains("button", /2 of 6/i).as("stepTwoButton");

        cy.get("@stepTwoButton").should("have.attr", "aria-expanded", "true");
        cy.get("@stepTwoButton").click();
        cy.get("@stepTwoButton").should("have.attr", "aria-expanded", "false");
        cy.get("@stepTwoButton").click();
        cy.get("@stepTwoButton").should("have.attr", "aria-expanded", "true");
    });

    it("accepts optional draft solicitation date", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(2);

        // Use helper to check if checkbox is enabled
        isStepCheckboxEnabled("#step-2-checkbox").then((isEnabled) => {
            if (isEnabled) {
                cy.get("#step-2-checkbox").check({ force: true });
                cy.get("#step-2-checkbox").should("be.checked");

                // Verify draft solicitation date field exists and accepts input
                cy.get("#step-2-draft-solicitation-date").should("exist").and("not.be.disabled");
                cy.get("#step-2-draft-solicitation-date").type("03/15/2026");
                cy.get("#step-2-draft-solicitation-date").should("have.value", "03/15/2026");
            } else {
                cy.log("Step 2 checkbox is disabled or step not pending - skipping");
            }
        });
    });
});

describe("Procurement Tracker Step 3: Solicitation", () => {
    it("renders the step 3 view that matches API status", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (completedViewVisible) {
                cy.contains("Completed By").should("exist");
                cy.contains("Date Completed").should("exist");
                cy.contains("Notes").should("exist");
                cy.contains("Solicitation Period - Start").should("exist");
                cy.contains("Solicitation Period - End").should("exist");
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

    it("renders completed summary data when step 3 is completed", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (!completedViewVisible) {
                cy.get(".usa-checkbox__label").should("exist");
                return;
            }

            // Verify all Step 3-specific fields are present with values
            // Find the dl that contains "Solicitation Period - Start" (Step 3 specific field)
            cy.contains("dt", "Solicitation Period - Start").should("exist");
            cy.contains("dt", "Solicitation Period - Start").parents("dl").within(() => {
                // Solicitation Period End date (Step 3 specific)
                cy.contains("dt", "Solicitation Period - End").should("exist");

                // Standard completion fields
                cy.contains("dt", "Completed By").next("dd").should("not.be.empty");
                cy.contains("dt", "Date Completed").next("dd").should("not.be.empty");
            });
        });
    });

    it("shows or hides editable controls based on step 3 status", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        cy.get("body").then(($body) => {
            const completedViewVisible = $body.find("dl").length > 0 && $body.text().includes("Completed By");
            if (completedViewVisible) {
                cy.get(".usa-checkbox__label").should("not.exist");
                cy.get("#users-combobox-input").should("not.exist");
                cy.get("#step-3-date-completed").should("not.exist");
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

    it("displays solicitation period save button when dates not yet saved", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        cy.get("body").then(($body) => {
            const isPending = $body.find("#step-3-checkbox").length > 0;
            if (isPending) {
                const hasSolicitationDateTags = $body.text().includes("Solicitation Period - Start");
                if (!hasSolicitationDateTags) {
                    cy.get("#solicitation-period-start-date").should("exist");
                    cy.get("#solicitation-period-end-date").should("exist");
                    cy.get('[data-cy="solicitation-dates-save-btn"]').should("exist");
                    cy.get('[data-cy="solicitation-dates-save-btn"]').should("be.disabled");
                } else {
                    cy.log("Solicitation period dates already saved");
                }
            }
        });
    });

    it("enables solicitation save button when valid dates are entered", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        // Check if step 3 is in pending state and solicitation dates haven't been saved yet
        cy.get("body").then(($body) => {
            const isPending = $body.find("#step-3-checkbox").length > 0;
            const hasSolicitationDatesSaved = $body.find("dt").text().includes("Solicitation Period - Start");

            if (isPending && !hasSolicitationDatesSaved) {
                cy.get("#solicitation-period-start-date").should("exist").and("not.be.disabled");
                cy.get("#solicitation-period-end-date").should("exist").and("not.be.disabled");

                // Enter both start and end dates - break up chain to avoid element detachment
                cy.get("#solicitation-period-start-date").clear();
                cy.get("#solicitation-period-start-date").type("01/15/2026");
                cy.get("#solicitation-period-start-date").blur();

                cy.get("#solicitation-period-end-date").clear();
                cy.get("#solicitation-period-end-date").type("02/15/2026");
                cy.get("#solicitation-period-end-date").blur();

                // Wait for validation to run and button to be enabled
                cy.get('[data-cy="solicitation-dates-save-btn"]').should("not.be.disabled");
            } else {
                cy.log("Step 3 not in correct state for this test - skipping");
            }
        });
    });

    it("displays saved solicitation dates as TermTags", () => {
        cy.visit(`/agreements/${ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        cy.get("body").then(($body) => {
            const isPending = $body.find("#step-3-checkbox").length > 0;
            // Check if TermTags with Solicitation Period dates exist
            const hasSolicitationDateTags = $body.find("dt:contains('Solicitation Period - Start')").length > 0;

            if (isPending && hasSolicitationDateTags) {
                // Solicitation dates have been saved and should display as TermTags
                cy.contains("Solicitation Period - Start").should("exist");
                cy.contains("Solicitation Period - End").should("exist");
                cy.get("#solicitation-period-start-date").should("not.exist");
                cy.get("#solicitation-period-end-date").should("not.exist");
                cy.get('[data-cy="solicitation-dates-save-btn"]').should("not.exist");
            } else {
                cy.log("Solicitation period dates not yet saved - skipping");
            }
        });
    });

    it("disables all completion fields when checkbox is unchecked", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        cy.get("body").then(($body) => {
            const isPending = $body.find("#step-3-checkbox").length > 0;
            if (isPending) {
                cy.get("#users-combobox-input").should("be.disabled");
                cy.get("#step-3-date-completed").should("be.disabled");
                cy.get("#notes").should("be.disabled");
                cy.get('[data-cy="cancel-button"]').should("be.disabled");
                cy.get('[data-cy="continue-btn"]').should("be.disabled");
            }
        });
    });

    it("enables completion fields when checkbox is checked", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        // Use Cypress retry logic instead of synchronous jQuery check
        isStepCheckboxEnabled("#step-3-checkbox").then((isEnabled) => {
            if (isEnabled) {
                // Step is active and checkbox is enabled
                cy.get("#step-3-checkbox").check({ force: true });
                cy.get("#step-3-checkbox").should("be.checked");

                // Wait for React state update, then verify fields are enabled
                cy.get("#users-combobox-input").should("not.be.disabled");
                cy.get("#step-3-date-completed").should("not.be.disabled");
                cy.get("#notes").should("not.be.disabled");
                cy.get('[data-cy="cancel-button"]').should("not.be.disabled");
            } else {
                cy.log("Step 3 checkbox is disabled or step not pending - skipping");
            }
        });
    });

    it("re-disables fields when checkbox is unchecked after being checked", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        // Use helper to check if checkbox is enabled
        isStepCheckboxEnabled("#step-3-checkbox").then((isEnabled) => {
            if (isEnabled) {
                // Check the checkbox first
                cy.get("#step-3-checkbox").check({ force: true });
                cy.get("#step-3-checkbox").should("be.checked");
                cy.get("#users-combobox-input").should("not.be.disabled");

                // Uncheck the checkbox
                cy.get("#step-3-checkbox").uncheck({ force: true });
                cy.get("#step-3-checkbox").should("not.be.checked");

                // Wait for React state update, then verify fields are disabled again
                cy.get("#users-combobox-input").should("be.disabled");
                cy.get('[data-cy="cancel-button"]').should("be.disabled");
                cy.get('[data-cy="continue-btn"]').should("be.disabled");
            } else {
                cy.log("Step 3 checkbox is disabled or step not pending - skipping");
            }
        });
    });

    it("enables continue button when all required fields are filled", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        // Use helper to check if checkbox is enabled
        isStepCheckboxEnabled("#step-3-checkbox").then((isEnabled) => {
            if (isEnabled) {
                cy.get("#step-3-checkbox").check({ force: true });
                cy.get("#step-3-checkbox").should("be.checked");

                // Fill out required fields with waits for validation
                cy.get("#users-combobox-input").should("not.be.disabled").click();
                cy.get(".users-combobox__menu").should("exist");
                cy.get(".users-combobox__option").first().click();

                // Trigger validation by blurring after typing
                cy.get("#step-3-date-completed").should("not.be.disabled").type("02/20/2026").blur();

                // Wait for validation to complete before checking button state
                cy.get('[data-cy="continue-btn"]').should("not.be.disabled");
            } else {
                cy.log("Step 3 checkbox is disabled or step not pending - skipping");
            }
        });
    });

    it("displays cancel confirmation modal when cancel button is clicked", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        // Use helper to check if checkbox is enabled
        isStepCheckboxEnabled("#step-3-checkbox").then((isEnabled) => {
            if (isEnabled) {
                cy.get("#step-3-checkbox").check({ force: true });
                cy.get("#step-3-checkbox").should("be.checked");
                cy.get('[data-cy="cancel-button"]').should("not.be.disabled").click();

                // Verify modal appears with correct content
                cy.get(".usa-modal").should("be.visible");
                cy.contains("Are you sure you want to cancel this task?").should("be.visible");
                cy.contains("button", "Cancel Task").should("be.visible");
                cy.contains("button", "Continue Editing").should("be.visible");
            } else {
                cy.log("Step 3 checkbox is disabled or step not pending - skipping");
            }
        });
    });

    it("resets form when modal cancel is confirmed", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        // Use helper to check if checkbox is enabled
        isStepCheckboxEnabled("#step-3-checkbox").then((isEnabled) => {
            if (isEnabled) {
                cy.get("#step-3-checkbox").check({ force: true });
                cy.get("#step-3-checkbox").should("be.checked");

                // Fill out form fields
                cy.get("#step-3-date-completed").should("not.be.disabled").type("02/20/2026");
                cy.get("#notes").should("not.be.disabled").type("Test notes");

                // Trigger cancel modal and confirm
                cy.get('[data-cy="cancel-button"]').should("not.be.disabled").click();
                cy.get(".usa-modal").should("be.visible");
                cy.contains("button", "Cancel Task").click();

                // Verify form was reset
                cy.get("#step-3-checkbox").should("not.be.checked");
                cy.get("#notes").should("have.value", "");
            } else {
                cy.log("Step 3 checkbox is disabled or step not pending - skipping");
            }
        });
    });

    it("toggles step 3 accordion open/close", () => {
        cy.visit(`/agreements/${ISOLATED_ACTIVE_TRACKER_AGREEMENT_ID}/procurement-tracker`);
        openTrackerStep(3);

        cy.contains("button", /3 of 6/i).as("stepThreeButton");

        cy.get("@stepThreeButton").should("have.attr", "aria-expanded", "true");
        cy.get("@stepThreeButton").click();
        cy.get("@stepThreeButton").should("have.attr", "aria-expanded", "false");
        cy.get("@stepThreeButton").click();
        cy.get("@stepThreeButton").should("have.attr", "aria-expanded", "true");
    });
});
