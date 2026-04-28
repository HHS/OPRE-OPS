/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/projects/1000/spending");
    cy.get("h1", { timeout: 10000 }).should("be.visible");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Project Spending Tab", () => {
    it("renders the spending page with correct project title and tab active", () => {
        cy.get("h1").should("contain", "Human Services Interoperability Support");
        cy.get("[data-cy='project-tab-Project Spending']").should("not.be.disabled");
        cy.contains("h2", "Project Spending Summary").should("be.visible");
        cy.contains("h2", "Agreements").should("be.visible");
    });

    it("shows the fiscal year selector with available FYs only", () => {
        cy.get("#fiscal-year-select").should("be.visible");
        // Should contain at least one option from the spending data
        cy.get("#fiscal-year-select option").should("have.length.at.least", 1);
    });

    it("renders the totals summary card", () => {
        cy.get("[data-cy='project-spending-totals-card']").should("be.visible");
        // Left card labels
        cy.get("[data-cy='project-spending-totals-card']").should("contain", "Project Total");
        cy.get("[data-cy='project-spending-totals-card']").should("contain", "Lifetime Project Total");
        cy.get("[data-cy='project-spending-totals-card']").should("contain", "Agreements");
    });

    it("renders the donut chart card", () => {
        cy.contains("Project Spending By Agreement Type").should("be.visible");
        // Legend items
        cy.contains("Contracts").should("be.visible");
        cy.contains("Partner").should("be.visible");
        cy.contains("Grants").should("be.visible");
        cy.contains("Direct Oblig.").should("be.visible");
    });

    it("renders the agreements table with rows", () => {
        cy.get("[data-cy='project-spending-agreements-table']").should("be.visible");
        // At least one agreement row
        cy.get("[data-cy='project-spending-agreements-table'] tbody tr").should("have.length.at.least", 1);
    });

    it("expands an agreement row to show detail fields", () => {
        // Detail fields should not be visible before expansion
        cy.contains("Procurement Shop").should("not.exist");

        // Click the first expand chevron
        cy.get("[data-testid='expand-row']").first().click();

        // Detail fields should now be visible
        cy.contains("Procurement Shop").should("be.visible");
        cy.contains("Subtotal").should("be.visible");
        cy.contains("Fees").should("be.visible");
        cy.contains("Lifetime Obligated").should("be.visible");
        cy.contains("Contract #").should("be.visible");
        cy.contains("Award Type").should("be.visible");
        cy.contains("Vendor").should("be.visible");
    });

    it("collapses an expanded agreement row", () => {
        cy.get("[data-testid='expand-row']").first().click();
        cy.contains("Procurement Shop").should("be.visible");

        cy.get("[data-testid='expand-row']").first().click();
        cy.contains("Procurement Shop").should("not.exist");
    });

    it("updates table when fiscal year is changed", () => {
        cy.get("#fiscal-year-select").then(($select) => {
            const options = $select.find("option");
            if (options.length < 2) return; // skip if only one FY available

            const firstFY = options.eq(0).val();
            const secondFY = options.eq(1).val();

            cy.get("#fiscal-year-select").select(secondFY);
            cy.contains(`FY ${secondFY} Total`).should("be.visible");

            cy.get("#fiscal-year-select").select(firstFY);
            cy.contains(`FY ${firstFY} Total`).should("be.visible");
        });
    });

    it("links agreement names to the agreement detail page", () => {
        cy.get("[data-cy='agreement-name'] a")
            .first()
            .should("have.attr", "href")
            .and("match", /\/agreements\/\d+/);
    });
});
