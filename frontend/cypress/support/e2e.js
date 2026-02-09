// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import "cypress-axe";
import "./commands";

// Reduce test flakiness by disabling CSS animations/transitions in all runs.
Cypress.on("window:before:load", (win) => {
    const style = win.document.createElement("style");
    style.setAttribute("data-cypress", "disable-animations");
    style.innerHTML = `
        *,
        *::before,
        *::after {
            animation: none !important;
            transition: none !important;
        }
    `;
    const head = win.document.head || win.document.documentElement;
    head.appendChild(style);
});

Cypress.Commands.add("login", () => {
    window.localStorage.setItem("access_token", "123");
});

Cypress.Commands.add("FakeAuth", (user) => {
    cy.session([user], async () => {
        cy.visit("/login");
        cy.contains("Sign in with FakeAuth").click();

        switch (user) {
            case "system-owner":
                cy.contains("System Owner").click();
                break;
            case "basic":
                cy.contains("User Demo").click();
                break;
            case "division-director":
                cy.contains("Division Director").click();
                break;
            case "budget-team":
                cy.contains("Budget Team Member").click();
                break;
            case "procurement-team":
                cy.contains("Procurement Team Member").click();
                break;
            case "power-user":
                cy.contains("Power User").click();
                break;
            default:
                // Handle any unspecified user types if necessary
                break;
        }

        cy.wait(100);
        cy.logLocalStorage();
        // TODO: Figure out why the below tests are required for this to complete.\
        // We presume it has something to do with "touching" the local storage, to ensure
        // the value is there <shrug>
        // IF YOU REMOVE, IT FAILS WITH "INVALID TOKEN" - Tim D.

        // Debugging: log out the localStorage "access_token" value
        const getToken = () => cy.window().its("localStorage").invoke("getItem", "access_token");

        // Repeatedly check the token until it's not null
        getToken()
            .should((tokenValue) => {
                expect(tokenValue).not.to.be.null;
            })
            .then((tokenValue) => {
                cy.log(`E2E USER TOKEN::: ${tokenValue}`);
                cy.window().invoke("console.log", `E2E::ACCESS_TOKEN:${tokenValue}`);
            });

        cy.logLocalStorage();
    });
});

Cypress.Commands.add("logLocalStorage", () => {
    cy.window().then((window) => {
        console.log("localStorage contents:", window.localStorage);
    });
});
