/// <reference types="cypress" />

import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
});

describe("Procurement Tracker page", () => {
    it("Procurement tracker tab should exist and be clickable for developed agreements", () => {
        cy.visit(`/agreements/13`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("exist");
        cy.get('[data-cy="details-tab-Procurement Tracker"]').click();
        cy.get("h2").contains("Procurement Tracker");

        cy.get('[data-cy="step-indicator-0"]').should("have.class", "usa-step-indicator__segment--current");
    });
    it("Procurement tracker tab should not exist for non developed agreements", () => {
        cy.visit(`/agreements/3`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("not.exist");
    });
    it("Procurement tracker tab should be disabled for agreements with budget lines not in executing status", () => {
        cy.visit(`/agreements/6`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("be.disabled");
    });
    it("should display message if user navigates through url to an agreement with budget lines not in executing status", () => {
        cy.visit(`/agreements/6/procurement-tracker`);
        cy.get("div").contains("No active Procurement Tracker found.");
    });
});
