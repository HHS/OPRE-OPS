/// <reference types="cypress" />

import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
});

describe("Procurement Tracker page", () => {
    it("details tab should exist and be clickable for developed agreements", () => {
        cy.visit(`/agreements/13`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("exist");
        cy.get('[data-cy="details-tab-Procurement Tracker"]').click();
        cy.get("h2").contains("Procurement Tracker");

        cy.get('[data-cy="step-indicator-0"]').should("have.class", "usa-step-indicator__segment--current");
    });
    it("details tab should not exist for non developed agreements", () => {});
    it("details tab should be disabled for agreements with budget lines not in executing status", () => {});
    it("should display message if user navigates through url to an agreement with budget lines not in executing status", () => {});
    it("should display message if no active trackers are found", () => {});
});
