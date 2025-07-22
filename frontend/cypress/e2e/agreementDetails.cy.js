/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
});

afterEach(() => {
    // Skip a11y check for the "Contract type agreement loads with budget lines" test
    if (Cypress.mocha.getRunner().test.title !== "Contract type agreement loads with budget lines") {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    }
});

it("Contract type agreement loads with details", () => {
    cy.visit("/agreements/1");
    cy.wait(2000);
    cy.get('[data-cy="alert"]').contains(
        "Contracts that are awarded have not been fully developed yet, but are coming soon."
    );
    cy.get('[data-cy="close-alert"]').click();
    cy.get("h1").contains("Contract #1: African American Child and Family Research Center");
    cy.get("h2").first().contains("Human Services Interoperability Support");
    cy.get('[data-cy="details-tab-Award & Modifications"]').should("be.disabled");
    cy.get('[data-cy="details-tab-Procurement Tracker"]').should("be.disabled");
    cy.get('[data-cy="details-tab-Documents"]').should("be.disabled");
    cy.get("h2").eq(1).contains("Agreement Details");
    cy.get('[data-cy="agreement-description"]').contains("Test description");
    cy.get('[data-cy="agreement-type-tag"]').contains("Contract");
    cy.get('[data-cy="contract-type-tag"]').contains("Firm Fixed Price (FFP)");
    cy.get('[data-cy="product-service-code-tag"]').contains("Other Scientific and Technical Consulting Services");
    cy.get('[data-cy="naics-code-tag"]').contains("541690");
    cy.get('[data-cy="program-support-code-tag"]').contains("R410 - Research");
    cy.get('[data-cy="procurement-shop-tag"]').contains("GCS");
    cy.get('[data-cy="agreement-reason-tag"]').contains("Recompete");
    cy.get('[data-cy="vendor-tag"]').contains("Vendor 1");
    cy.get('[data-cy="division-director-tag"]').should("contain", "Dave Director").and("contain", "Director Derrek");
    cy.get('[data-cy="team-leader-tag"]')
        .should("contain", "Amy Madigan")
        .and("contain", "Chris Fortunato")
        .and("contain", "Ivelisse Martinez-Beck")
        .and("contain", "Katie Pahigiannis")
        .and("contain", "Sheila Celentano");
    cy.get('[data-cy="project-officer-tag"]').contains("Chris Fortunato");
    cy.get('[data-cy="alternate-project-officer-tag"]').contains("Dave Director");
    cy.get('[data-cy="team-member-tag-500"]').contains("Chris Fortunato");
    cy.get("h3").contains("Notes");
    cy.get("p.font-12px").contains("There are currently no notes for this agreement.");
});

it("Non contract type agreement loads with details", () => {
    cy.visit("/agreements/11");
    cy.get('[data-cy="alert"]').contains(
        "Agreements that are grants, inter-agency agreements (IAAs), assisted acquisitions (AAs) or direct obligations have not been developed yet, but are coming soon."
    );
    cy.get('[data-cy="close-alert"]').click();
    cy.get("h1").contains("Support Contract #1");
    cy.get("h2").first().contains("Support Project #1");
    cy.get("h2").eq(1).contains("Agreement Details");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(1)').contains("Agreement Type");
    cy.get('[data-cy="details-right-col"] > :nth-child(1) > :nth-child(2) > .font-12px').contains("AA");
    cy.get('[data-cy="details-right-col"] > :nth-child(2) > :nth-child(1)').contains("COR");
    cy.get("span").contains("Amelia Popham");
    cy.get('[data-cy="details-right-col"] > :nth-child(2) > :nth-child(2)').contains("Alternate COR");
    cy.get("span").contains("TBD");
    cy.get('[data-cy="details-right-col"] > :nth-child(3) > :nth-child(1)').contains("Team Members");
    cy.get("span").contains("Niki Denmark");
    cy.get("span").contains("System Owner");
});

it("Contract type agreement loads with budget lines", () => {
     cy.visit("/agreements/10");
    cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
    cy.get('[data-cy="currency-summary-card"]')
        .should("contain", "Agreement Total")
        .and("contain", "$ 3,000,000") // total
        .and("contain", "$3,000,000") // sub-total
        .and("contain", "$0") // fees
        .and("contain", "GCS"); // fee rate
    cy.get('[data-cy="blis-by-fy-card"]').should("exist");
    cy.get("tbody").children().as("table-rows").should("have.length.greaterThan", 0);
    // toggle on Draft BLIs
    cy.get("#toggleDraftBLIs").should("exist");
    cy.get("#toggleDraftBLIs").click();
    cy.get('[data-cy="currency-summary-card"]')
        .should("contain", "$ 4,000,000.00")
        .and("contain", "$4,000,000.00")
        .and("contain", "$0")
        .and("contain", "GCS");
    cy.get('[data-cy="blis-by-fy-card"]')
        .should("contain", "$4,000,000.00");
    cy.get("#edit").click().wait(2000);
    cy.get("[data-testid='budget-line-row-15004']")
        .trigger("mouseover")
        .find(".usa-tooltip")
        .find(".usa-tooltip__body")
        .should("contain", "If you need to edit a budget line in Executing Status, please contact the budget team");
    cy.get("[data-testid='budget-line-row-15005']")
        .trigger("mouseover")
        .find(".usa-tooltip")
        .find(".usa-tooltip__body")
        .should("contain", "Obligated budget lines cannot be edited");
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
    cy.get("#contract-type").select("Time & Materials (T&M)");
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
