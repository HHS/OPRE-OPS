/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

describe("Agreements List - Pagination Export", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit("/agreements");
        cy.get("#fiscal-year-select").select("All");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("should have an export button", () => {
        cy.get("button").contains("Export").should("exist");
    });

    it("export button should be clickable when agreements exist", () => {
        cy.get("button").contains("Export").should("not.be.disabled");
    });
});
