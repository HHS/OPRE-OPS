/// <reference types="cypress" />

import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
});

describe("Procuerement Tracker page", () => {
    it("procurement tracker details tab should exist and be clickable for awarded agreements", () => {
        cy.visit(`/agreements/7`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("exist");
        cy.get('[data-cy="details-tab-Procurement Tracker"]').click();
        cy.get("h2").contains("Procurement Tracker");
    });
    it("procurement tracker details tab should not exist for unawarded", () => {
        cy.visit(`/agreements/9`);
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("not.exist");
    });
});
