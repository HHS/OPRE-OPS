/// <reference types="cypress" />
import { login } from "../../src/components/Auth/authSlice";

// Define at the top of the spec file or just import it
export const terminalLog = (violations) => {
    cy.task(
        "log",
        `${violations.length} accessibility violation${violations.length === 1 ? "" : "s"} ${
            violations.length === 1 ? "was" : "were"
        } detected`
    );
    // pluck specific keys to keep the table readable
    const violationData = violations.map(({ id, impact, description, nodes }) => ({
        id,
        impact,
        description,
        nodes: nodes.length
    }));

    cy.task("table", violationData);
    cy.task(
        "log",
        JSON.stringify({ event: "a11y_violations", count: violationData.length, violations: violationData })
    );
};
/**
 *
 * @param {"basic" | "system-owner" | "division-director" | "budget-team" | "procurement-team" | 'power-user'} name
 */
export const testLogin = (name) => {
    cy.visit("/");
    // cy.fakeLogin(name);
    cy.FakeAuth(name);
    cy.log("xxxxxxx Completed FakeAuth ****** ");
    cy.visit("/"); // This is mostly to "touch" the page, and ensure the window is active.
    cy.window().its("store").should("exist");
    cy.window().its("store").invoke("dispatch", login());
};

/**
 * Opens a specific procurement tracker step accordion
 * @param {number} stepNumber - The step number (1-6)
 */
export const openTrackerStep = (stepNumber) => {
    // Validate input to prevent potential ReDoS attacks
    if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 6) {
        throw new Error(`Invalid step number: ${stepNumber}. Must be an integer between 1 and 6.`);
    }

    // Use hardcoded regexes to avoid dynamic RegExp construction (security best practice)
    const stepRegexMap = {
        1: /1 of 6/i,
        2: /2 of 6/i,
        3: /3 of 6/i,
        4: /4 of 6/i,
        5: /5 of 6/i,
        6: /6 of 6/i
    };

    // Close all other open steps first so only the target step is expanded.
    // This prevents text/elements from other open steps polluting page-level assertions.
    cy.get("button.usa-accordion__button[aria-expanded='true']").each(($btn) => {
        const text = $btn.text();
        if (!stepRegexMap[stepNumber].test(text)) {
            cy.wrap($btn).click();
            // Wait for the accordion to collapse before continuing
            cy.wrap($btn).should("have.attr", "aria-expanded", "false");
        }
    });

    cy.contains("button", stepRegexMap[stepNumber]).then(($button) => {
        if ($button.attr("aria-expanded") === "false") {
            cy.wrap($button).click();
        }
    });

    // Wait for the target step to be fully expanded before returning
    cy.contains("button", stepRegexMap[stepNumber]).should("have.attr", "aria-expanded", "true");
};

/**
 * Checks if a procurement tracker step is in completed state
 * @returns {Cypress.Chainable<boolean>}
 */
export const isStepCompleted = () => {
    return cy.get("body").then(($body) => {
        return $body.find("dl").length > 0 && $body.text().includes("Completed By");
    });
};

/**
 * Returns whether the currently-open accordion step shows the completed summary view.
 * Scopes the check to the expanded accordion content so other open steps don't interfere.
 * @param {number} stepNumber - 1-6
 * @returns {Cypress.Chainable<boolean>}
 */
export const isStepContentCompleted = (stepNumber) => {
    const stepRegexMap = {
        1: /1 of 6/i,
        2: /2 of 6/i,
        3: /3 of 6/i,
        4: /4 of 6/i,
        5: /5 of 6/i,
        6: /6 of 6/i
    };
    return cy.contains("button", stepRegexMap[stepNumber]).then(($btn) => {
        const contentId = $btn.attr("aria-controls");
        if (!contentId) return false;
        return cy.get(`#${contentId}`).then(($content) => {
            return $content.find("dl").length > 0 && $content.text().includes("Completed By");
        });
    });
};

/**
 * Checks if a step's checkbox is enabled (step is active and pending)
 * @param {string} checkboxId - The checkbox ID (e.g., "#step-1-checkbox")
 * @returns {Cypress.Chainable<boolean>}
 */
export const isStepCheckboxEnabled = (checkboxId) => {
    return cy.get("body").then(($body) => {
        const checkboxExists = $body.find(checkboxId).length > 0;
        const checkboxDisabled = $body.find(checkboxId).is(":disabled");
        return checkboxExists && !checkboxDisabled;
    });
};
