/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("Contract type agreement loads with details", () => {
    cy.visit("/agreements/1");
    cy.wait(2000);
    cy.get('[data-cy="alert"]').contains("Contracts that are awarded have not been fully developed yet, but are coming soon.");
    cy.get('[data-cy="close-alert"]').click();
    cy.get("h1").contains("Contract #1: African American Child and Family Research Center");
    cy.get("h2").first().contains("Human Services Interoperability Support");
    cy.get('[data-cy="details-tab-Award & Modifications"]').should("be.disabled");
    cy.get('[data-cy="details-tab-Procurement Tracker"]').should("be.disabled");
    cy.get('[data-cy="details-tab-Documents"]').should("be.disabled");
    cy.get("h2").eq(1).contains("Agreement Details");
    cy.get('[data-cy="details-left-col"] > :nth-child(1) > .text-base-dark').contains("Description");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(1)').contains("Agreement Type");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(2) > .font-12px').contains("Contract");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(3)').contains("Contract Type");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(4) > .font-12px').contains("Labor Hour (LH)");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(5)').contains("Product Service Code");
    cy.get('[data-cy="details-right-col"] > :nth-child(5) > :nth-child(1) > :nth-child(1)').contains("COR");
    cy.get('[data-cy="details-right-col"] > :nth-child(5) > :nth-child(1) > :nth-child(2)').contains("Chris Fortunato");
    cy.get('[data-cy="details-right-col"] > :nth-child(5) > :nth-child(2) > :nth-child(1)').contains("Alternate COR");
    cy.get('[data-cy="details-right-col"] > :nth-child(5) > :nth-child(2) > :nth-child(2)').contains("Dave Director");
    cy.get('[data-cy="details-left-col"] > :nth-child(2)').contains("Notes");
    cy.get("p.font-12px").contains("There are currently no notes for this agreement.");
});

it("Non contract type agreement loads with details", () => {
    cy.visit("/agreements/11");
    cy.get('[data-cy="alert"]').contains("Agreements that are grants, inter-agency agreements (IAAs), assisted acquisitions (AAs) or direct obligations have not been developed yet, but are coming soon.");
    cy.get('[data-cy="close-alert"]').click();
    cy.get("h1").contains("Support Contract #1");
    cy.get("h2").first().contains("Support Project #1");
    cy.get("h2").eq(1).contains("Agreement Details");
    cy.get('[data-cy="details-left-col"] > :nth-child(1) > .text-base-dark').contains("Description");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(1)').contains("Agreement Type");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(2) > .font-12px').contains("Contract");
    cy.get('[data-cy="details-right-col"] > :nth-child(2) > :nth-child(1)').contains("COR");
    cy.get('[data-cy="details-right-col"] > :nth-child(2) > :nth-child(2)').contains("Alternate COR");
    cy.get('[data-cy="details-right-col"] > :nth-child(3) > :nth-child(1)').contains("Team Members");
});

it("Contract type agreement loads with budget lines", () => {
    cy.visit("/agreements/9");
    cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
    cy.get('[data-cy="currency-summary-card"]').contains("Agreement Total");
    cy.get('[data-cy="currency-summary-card"]').contains("$ 1,005,000.00"); // agreement total
    cy.get('[data-cy="blis-by-fy-card"]').should("exist");
    cy.get("tbody").children().as("table-rows").should("have.length.greaterThan", 0);
    // toggle on Draft BLIs
    cy.get("#toggleDraftBLIs").should("exist");
    cy.get("#toggleDraftBLIs").click();
    cy.get('[data-cy="currency-summary-card"]').contains("$1,000,000.00");
    cy.get('[data-cy="blis-by-fy-card"]').contains("$301,500.00");
});

it("Non contract type agreement loads with budget lines", () => {
    cy.visit("/agreements/11");
    cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
    cy.get("#edit").should("not.exist");
    cy.get('[data-cy="bli-continue-btn-disabled"]').should("exist");
    cy.get('[data-cy="currency-summary-card"]').contains("Agreement Total");
    cy.get('[data-cy="currency-summary-card"]').contains("$ 301,500.00");
    cy.get('[data-cy="blis-by-fy-card"]').should("exist");
    cy.get("tbody").children().as("table-rows").should("have.length.greaterThan", 0);
    cy.get("#toggleDraftBLIs").should("exist");
});

it("should not warn when not making changes to agreement and tabbing to BLI tab", () => {
    cy.visit("/agreements/9");
    cy.get("#edit").click();
    cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
    cy.get("#ops-modal").should("not.exist");
});

it("should warn when making changes to agreement and tabbing out", () => {
    cy.visit("/agreements/9");
    cy.get("#edit").click();
    cy.get("#contract-type").select("Firm Fixed Price (FFP)");
    cy.get('[data-cy="details-tab-Agreement Details"]').click();
    cy.get("#ops-modal").should("exist");
});

it("should handle cancel edits", () => {
    cy.visit("/agreements/9");
    // Agreement Details Tab
    cy.get("#edit").click();
    cy.get("#contract-type").select("Firm Fixed Price (FFP)");
    cy.get('[data-cy="cancel-button"]').click();
    cy.get("#ops-modal-heading").contains("Are you sure you want to cancel editing? Your changes will not be saved.");
    cy.get('[data-cy="confirm-action"]').click();
    //test Agreement BLI Tab
    cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
    cy.get("#edit").click();
    cy.get('[data-cy="cancel-button"]').click();
    cy.get("#ops-modal-heading").contains("Are you sure you want to cancel editing? Your changes will not be saved.");
    cy.get('[data-cy="confirm-action"]').click();
});
