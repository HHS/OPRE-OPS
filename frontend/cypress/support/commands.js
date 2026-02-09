
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

const severityIndicators = {
    minor: "⚪️",
    moderate: "🟡",
    serious: "🟠",
    critical: "🔴"
};

const violationHandler = (violations) => {
    violations.forEach((violation) => {
        const violationDomNodes = violation.nodes;
        const violationJQueryNodesReference = Cypress.$(violationDomNodes.map((node) => node.target).join(","));

        Cypress.log({
            name: `a11y ${severityIndicators[violation.impact]}`,
            message: `[${violation.help}](${violation.helpUrl})`,
            $el: violationJQueryNodesReference,
            consoleProps: () => violation
        });

        violationDomNodes.forEach((node) => {
            Cypress.log({
                name: "node",
                message: node.target,
                $el: Cypress.$(node.target.join(",")),
                consoleProps: () => violation
            });
        });
    });
};

Cypress.Commands.overwrite("checkA11y", (originalFn, context, options, violationCallback, skipFailures) => {
    if (!violationCallback) {
        violationCallback = violationHandler;
    }
    return originalFn(context, options, violationCallback, skipFailures);
});

Cypress.Commands.add("verifyTableColumnValues", (selector, expectedValue, timeout = 30000) => {
    cy.get(selector, { timeout }).should(($cells) => {
        const texts = [...$cells].map((cell) => cell.textContent.trim()).filter(Boolean);
        expect(texts.length).to.be.greaterThan(0);
        expect(texts.every((text) => text === expectedValue)).to.eq(true);
    });
});

// React 19-specific commands for reliable state waiting

/**
 * Waits for the "Editing..." indicator to appear or disappear
 * @param {boolean} shouldExist - Whether the indicator should exist (true) or not exist (false)
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 */
Cypress.Commands.add("waitForEditingState", (shouldExist = true, timeout = 10000) => {
    if (shouldExist) {
        cy.get("#editing", { timeout }).should("exist").and("have.text", "Editing...");
    } else {
        cy.get("#editing", { timeout }).should("not.exist");
    }
});

/**
 * Waits for a modal to appear and be visible
 * @param {string} modalSelector - CSS selector for the modal (default: "#ops-modal")
 * @param {number} timeout - Timeout in milliseconds (default: 15000)
 */
Cypress.Commands.add("waitForModalToAppear", (modalSelector = "#ops-modal", timeout = 15000) => {
    cy.get(modalSelector, { timeout }).should("exist").and("be.visible");
});

/**
 * Waits for a modal to close (either removed from DOM or hidden)
 * @param {string} modalSelector - CSS selector for the modal (default: "#ops-modal")
 * @param {number} timeout - Timeout in milliseconds (default: 20000)
 */
Cypress.Commands.add("waitForModalToClose", (modalSelector = "#ops-modal", timeout = 20000) => {
    cy.get("body", { timeout }).then(($body) => {
        if ($body.find(modalSelector).length === 0) {
            return;
        }

        cy.get(modalSelector, { timeout }).should(($modal) => {
            const isHidden =
                !$modal.is(":visible") || !$modal.hasClass("is-visible") || $modal.attr("aria-hidden") === "true";
            expect(isHidden).to.eq(true);
        });
    });
});

/**
 * Generic command to wait for a state change based on element text
 * @param {string} selector - CSS selector for the element
 * @param {string} expectedText - Expected text content
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 */
Cypress.Commands.add("waitForStateChange", (selector, expectedText, timeout = 10000) => {
    cy.get(selector, { timeout }).should("have.text", expectedText);
});

/**
 * Selects a dropdown value and waits for React to process the change
 * Handles React 19's concurrent rendering and state propagation delays
 * @param {string} selector - CSS selector for the select element
 * @param {string} value - Value to select
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 */
Cypress.Commands.add("selectAndWaitForChange", (selector, value, timeout = 10000) => {
    cy.get(selector).select(value);
    // Wait for React to process the change through state propagation
    cy.get(selector, { timeout }).should("have.value", value);
});
