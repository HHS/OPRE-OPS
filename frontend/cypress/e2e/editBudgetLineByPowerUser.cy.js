/// <reference types="cypress" />
import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("power-user");
});

// afterEach(() => {
//     cy.injectAxe();
//     cy.checkA11y(null, null, terminalLog);
// });

it("can login as power user", () => {
    cy.visit(`/agreements/10/budget-lines`);
});
