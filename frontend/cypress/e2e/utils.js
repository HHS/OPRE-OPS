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

    cy.contains("button", stepRegexMap[stepNumber]).then(($button) => {
        if ($button.attr("aria-expanded") === "false") {
            cy.wrap($button).click();
        }
    });
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
