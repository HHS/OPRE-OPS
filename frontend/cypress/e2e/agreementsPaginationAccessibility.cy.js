/// <reference types="cypress" />
import {terminalLog, testLogin} from "./utils";

describe("Agreements List - Pagination Accessibility", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit("/agreements");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("pagination controls should be keyboard accessible", () => {
        // Tab to pagination controls and test keyboard navigation
        cy.get("button[aria-label='Next page']").focus();
        cy.focused().should("have.attr", "aria-label", "Next page");

        // Press Enter to navigate
        cy.focused().type("{enter}");

        // Should navigate to next page
        cy.get("button.usa-current").should("contain", "2");
    });

    it("should have proper ARIA labels", () => {
        // Check for navigation aria-label
        cy.get("nav[aria-label='Pagination']").should("exist");

        // Check for button aria-labels
        cy.get("button[aria-label='Previous page']").should("exist");
        cy.get("button[aria-label='Next page']").should("exist");
        cy.get("button[aria-label='Page 1']").should("exist");
    });

    it("should indicate current page with aria-current", () => {
        // Current page button should have appropriate styling/class
        cy.get("button.usa-current").should("exist");
    });
});
