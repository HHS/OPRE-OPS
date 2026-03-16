/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("budget-team");
    cy.visit("/reporting");
    cy.contains("Loading...", { timeout: 30000 }).should("not.exist");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Reporting Page", () => {
    it("loads with correct page structure", () => {
        cy.get("h1").should("have.text", "OPRE Budget Reporting");
        cy.contains("All Portfolios").should("exist");
        cy.contains("h2", "Budget Summary").should("exist");
        cy.contains("h2", "Spending Summary").should("exist");
        cy.get("select").first().should("exist"); // FY selector
        cy.contains("button", "Filter").should("exist");
    });

    it("applies portfolio filter and shows filter tags", () => {
        cy.contains("button", "Filter").click();
        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").find(".portfolios-combobox__option").first().click();
        cy.contains("button", "Apply").click();

        cy.contains("Filters Applied:").should("exist");
        cy.get("button[id^='filter-tag-']").should("have.length.greaterThan", 0);
    });

    it("removes a filter tag", () => {
        // Apply a filter
        cy.contains("button", "Filter").click();
        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").find(".portfolios-combobox__option").first().click();
        cy.contains("button", "Apply").click();
        cy.contains("Filters Applied:").should("exist");

        // Remove filter tag
        cy.get("button[id^='filter-tag-']").first().click();

        cy.contains("Filters Applied:").should("not.exist");
    });

    it("resets filters via Reset button", () => {
        // Apply a filter
        cy.contains("button", "Filter").click();
        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").find(".portfolios-combobox__option").first().click();
        cy.contains("button", "Apply").click();
        cy.contains("Filters Applied:").should("exist");

        // Reset filters
        cy.contains("button", "Filter").click();
        cy.contains("button", "Reset").click();
        cy.contains("button", "Apply").click();

        cy.contains("Filters Applied:").should("not.exist");
    });
});
