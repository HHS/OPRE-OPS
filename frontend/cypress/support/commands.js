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
//
//
// -- This will overwrite an existing command --

const severityIndicators = {
    minor: "⚪️",
    moderate: "🟡",
    serious: "🟠",
    critical: "🔴",
};

const violationHandler = (violations) => {
    violations.forEach((violation) => {
        const violationDomNodes = violation.nodes;
        const violationJQueryNodesReference = Cypress.$(violationDomNodes.map((node) => node.target).join(","));

        Cypress.log({
            name: `a11y ${severityIndicators[violation.impact]}`,
            message: `[${violation.help}](${violation.helpUrl})`,
            $el: violationJQueryNodesReference,
            consoleProps: () => violation,
        });

        violationDomNodes.forEach((node) => {
            Cypress.log({
                name: "node",
                message: node.target,
                $el: Cypress.$(node.target.join(",")),
                consoleProps: () => violation,
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
