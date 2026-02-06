/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";
import { NO_DATA } from "../../src/constants";

beforeEach(() => {
    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("agreement details", () => {
    it("Awarded Contract type agreement loads with details", () => {
        cy.visit("/agreements/7");
        cy.get("h1").contains("MIHOPE Check-In");
        cy.get("h2").first().contains("Mother and Infant Home Visiting Program Evaluation 2");
        cy.get("span").contains("Awarded");
        cy.get('[data-cy="details-tab-Award & Modifications"]').should("be.disabled");
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("be.enabled");
        cy.get('[data-cy="details-tab-Documents"]').should("be.disabled");
        cy.get("h2").eq(1).contains("Agreement Details");
        cy.get('[data-cy="agreement-description"]').contains("Test description");
        cy.get('[data-cy="agreement-nickname-tag"]').contains("TBD");
        cy.get('[data-cy="agreement-type-tag"]').contains("Contract");
        cy.get('[data-cy="contract-type-tag"]').contains("Time & Materials (T&M)");
        cy.get('[data-cy="product-service-code-tag"]').contains("Other Scientific and Technical Consulting Services");
        cy.get('[data-cy="naics-code-tag"]').contains("541690");
        cy.get('[data-cy="program-support-code-tag"]').contains("R410 - Research");
        cy.get('[data-cy="procurement-shop-tag"]').contains("GCS");
        cy.get('[data-cy="agreement-reason-tag"]').contains("New Requirement");
        cy.get('[data-cy="vendor-tag"]').contains("Vendor 2");
        cy.get('[data-cy="division-director-tag"]').should("contain", "Dave Director");
        cy.get('[data-cy="team-leader-tag"]').should("contain", "Ivelisse Martinez-Beck");
        cy.get('[data-cy="project-officer-tag"]').contains("System Owner");
        cy.get('[data-cy="contract-number-tag"]').contains("XXXX000000007");
        cy.get('[data-cy="alternate-project-officer-tag"]').contains("Dave Director");
        cy.get("h3").contains("Notes");
        cy.get("p.font-12px").contains("There are currently no notes for this agreement.");
    });

    it("AA type agreement loads with details", () => {
        cy.visit("/agreements/5");
        cy.get("h1").contains("AA #1: Fathers and Continuous Learning (FCL)");
        cy.get("h2").first().contains("Annual Performance Plans and Reports");
        cy.get("h2").eq(1).contains("Agreement Details");
        cy.get("span").contains("Awarded").should("not.exist");

        // Field verifications for AA type agreement
        cy.get('[data-cy="details-right-col"]').within(() => {
            cy.contains("Agreement Type").should("exist");
            cy.get('[data-cy="agreement-type-tag"]').should("contain", "Partner (IAA, AA, IDDA, IPA)");
            cy.get('[data-cy="agreement-nickname-tag"]').contains("AA1");
            cy.contains("Partner Type").should("exist");
            cy.get('[data-cy="partner-type-tag"]').should("contain", "Assisted Acquisition (AA)");
            cy.contains("Funding Method").should("exist");
            cy.get('[data-cy="funding-method-tag"]').should("contain", "Advanced Funding");
            cy.contains("Requesting Agency").should("exist");
            cy.get('[data-cy="requesting-agency-tag"]').should("contain", "Administration for Children and Families");
            cy.contains("Servicing Agency").should("exist");
            cy.get('[data-cy="servicing-agency-tag"]').should("contain", "Another Federal Agency");
            cy.contains("Contract Type").should("exist");
            cy.get('[data-cy="contract-type-tag"]').should("exist");
            cy.contains("Service Requirement Type").should("exist");
            cy.get('[data-cy="servicing-required-type-tag"]').should("contain", "Severable");
            cy.contains("Product Service Code").should("exist");
            cy.get('[data-cy="product-service-code-tag"]').should(
                "contain",
                "Other Scientific and Technical Consulting Services"
            );
            cy.contains("NAICS Code").should("exist");
            cy.get('[data-cy="naics-code-tag"]').should("contain", "541690");
            cy.contains("Program Support Code").should("exist");
            cy.get('[data-cy="program-support-code-tag"]').should("contain", "R410 - Research");
            cy.contains("Procurement Shop").should("exist");
            cy.get('[data-cy="procurement-shop-tag"]').should("contain", "NIH");
            cy.contains("Agreement Reason").should("exist");
            cy.get('[data-cy="agreement-reason-tag"]').should("contain", "New Requirement");
            cy.contains("Methodologies").should("exist");
            cy.get('[data-cy="methodology-tag-3"]').should("contain", "Descriptive Study");
            cy.get('[data-cy="methodology-tag-4"]').should("contain", "Impact Study");
            cy.contains("Special Topic/Populations").should("exist");
            cy.get('[data-cy="special-topic-tag-4"]').should("contain", "Special Topic 4");
            cy.contains("Division Director(s)").should("exist");
            cy.get('[data-cy="division-director-tag-no-data"]').should("exist");
            cy.contains("Team Leader(s)").should("exist");
            cy.get('[data-cy="team-leader-tag-no-data"]').should("exist");
            cy.contains("COR").should("exist");
            cy.get('[data-cy="project-officer-tag"]').should("contain", "Chris Fortunato");
            cy.contains("Alternate COR").should("exist");
            cy.get('[data-cy="alternate-project-officer-tag"]').should("contain", NO_DATA);
            cy.contains("Team Members").should("exist");
            cy.get('[data-cy="contract-number-tag"]').should("not.exist");
        });
    });

    it("Contract type agreement loads with budget lines", () => {
        cy.visit("/agreements/9/budget-lines");
        cy.get("h1").contains("Interoperability Initiatives");
        cy.get('[data-cy="currency-summary-card"]')
            .should("contain", "Agreement Total")
            .and("contain", "$ 1,000,000") // total
            .and("contain", "$1,000,000") // sub-total
            .and("contain", "$0") // fees
            .and("contain", "GCS"); // fee rate
        cy.get('[data-cy="blis-by-fy-card"]').should("exist");
        cy.get("tbody").children().as("table-rows").should("have.length.greaterThan", 0);
        // toggle on Draft BLIs
        cy.get("#toggleDraftBLIs").should("exist");
        cy.get("#toggleDraftBLIs").click();
        cy.get("h1").contains("Interoperability Initiatives");
        cy.get('[data-cy="currency-summary-card"]')
            .should("contain", "$ 1,000,000.00")
            .and("contain", "1,000,000.00")
            .and("contain", "$0")
            .and("contain", "GCS");
        cy.get('[data-cy="blis-by-fy-card"]').should("contain", "$300,000.00");
        cy.get('[data-cy="blis-by-fy-card"]').should("contain", "$700,000.00");
        cy.get(".usa-table").should("exist");
        cy.get('[data-cy="back-button"]').should("not.exist");
    });

    it("should not allow editing OBLIGATED BLIs", () => {
        cy.visit("/agreements/10/budget-lines");
        cy.get("#edit").click();
        cy.get("[data-testid='budget-line-row-15005']").trigger("mouseover");
        cy.get("[data-testid='budget-line-row-15005'] .usa-tooltip .usa-tooltip__body").should(
            "contain",
            "Obligated budget lines cannot be edited"
        );
    });

    it("should not allow editing EXECUTING BLIs", () => {
        cy.visit("/agreements/10/budget-lines");
        cy.get("#edit").click();
        cy.get("[data-testid='budget-line-row-15004']").trigger("mouseover");
        cy.get("[data-testid='budget-line-row-15004'] .usa-tooltip .usa-tooltip__body").should(
            "contain",
            "If you need to edit a budget line in Executing Status, please contact the budget team"
        );
    });

    it("Should allow the user to export BLIs for an agreement", () => {
        cy.visit("/agreements/9/budget-lines");
        // Agreement 9 has BLIs to export
        cy.get('[data-cy="budget-line-export"]').should("exist");
    });

    it("Direct Obligation type agreement loads with budget lines and temp banner", () => {
        cy.visit("/agreements/2");
        cy.get('[data-cy="alert"]').contains(
            "Agreements that are grants, other partner agreements (IAAs, IPAs, IDDAs), or direct obligations have not been developed yet, but are coming soon."
        );
        cy.get('[data-cy="close-alert"]').click();
        cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
        cy.get("#edit").should("not.exist");
        cy.get('[data-cy="bli-continue-btn-disabled"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').contains("Agreement Total");
        cy.get('[data-cy="currency-summary-card"]').contains("$ 246,354,000.");
        cy.get('[data-cy="blis-by-fy-card"]').should("exist");
        cy.get("tbody").children().as("table-rows").should("have.length.greaterThan", 0);
        cy.get("#toggleDraftBLIs").should("exist");
    });

    it("Grants load with temp banner", () => {
        cy.visit("/agreements/3");
        cy.get('[data-cy="alert"]').contains(
            "Agreements that are grants, other partner agreements (IAAs, IPAs, IDDAs), or direct obligations have not been developed yet, but are coming soon."
        );
        cy.get('[data-cy="close-alert"]').click();
        cy.get("#edit").should("not.exist");
    });

    it("IAAs load with temp banner", () => {
        cy.visit("/agreements/4");
        cy.get('[data-cy="alert"]').contains(
            "Agreements that are grants, other partner agreements (IAAs, IPAs, IDDAs), or direct obligations have not been developed yet, but are coming soon."
        );
        cy.get('[data-cy="close-alert"]').click();
        cy.get("#edit").should("not.exist");
    });

    it("should not warn when not making changes to agreement and tabbing to BLI tab", () => {
        cy.visit("/agreements/9");
        cy.get("#edit").click();
        cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
        cy.get("#ops-modal").should("not.exist");
    });

    it("should handle cancel edits", () => {
        cy.visit("/agreements/9");
        // Agreement Details Tab
        cy.get("#edit").click();
        cy.get("#contract-type").select("Firm Fixed Price (FFP)");
        cy.get('[data-cy="cancel-button"]').click();
        cy.get("#ops-modal-heading").contains(
            "Are you sure you want to cancel editing? Your changes will not be saved."
        );
        cy.get('[data-cy="confirm-action"]').click();
        //test Agreement BLI Tab
        cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
        cy.get("#edit").click();
        cy.get('[data-cy="cancel-button"]').click();
        cy.get("#ops-modal-heading").contains(
            "Are you sure you want to cancel editing? Your changes will not be saved."
        );
        cy.get('[data-cy="confirm-action"]').click();
    });

    it.skip("Contract type agreement services components with sub component", () => {
        cy.visit("/agreements/10/budget-lines");
        cy.get("#edit").click();
        // section.services-components-list should contain 3 children:
        cy.get('[data-cy="services-component-list"]').should("exist");
        cy.get('[data-cy="services-component-list"]').children().should("have.length", 3);

        // Wait for services components to load and ensure specific components are rendered
        cy.get('[data-cy="Services Component 1-1.1"]', { timeout: 30000 }).should("be.visible");
        cy.get('[data-cy="Services Component 1-1.2"]', { timeout: 30000 }).should("be.visible");

        cy.get('[data-cy="Services Component 1-1.1"]').within(() => {
            cy.get("button").should("contain.text", "Services Component 1-1.1");
            cy.get("td").should("contain.text", "15003");
            cy.get("td").should("contain.text", "15002");
        });

        cy.get('[data-cy="Services Component 1-1.2"]').within(() => {
            cy.get("button").should("contain.text", "Services Component 1-1.2");
            cy.get("td").should("contain.text", "15005");
            cy.get("td").should("contain.text", "15004");
        });
    });

    it("should show modal when navigating between tabs with unsaved agreement details changes", () => {
        cy.visit("/agreements/9");
        cy.get("#edit").click();
        cy.get("#editing").should("have.text", "Editing...");

        // Make a change to agreement details
        cy.get("#contract-type").select("Time & Materials (T&M)");
        cy.wait(500); // Wait for state to update

        // Try to navigate to Budget Lines tab
        cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();

        // Verify modal appears
        cy.get("#ops-modal", { timeout: 10000 }).should("exist");
        cy.get("#ops-modal-heading").should("contain", "You have unsaved changes");
        cy.get("#ops-modal-description").should(
            "contain",
            "Do you want to save your changes before leaving this page?"
        );

        // Test ESC key cancels navigation
        cy.get("body").type("{esc}");
        cy.get("#ops-modal").should("not.exist");
        cy.url().should("not.include", "/budget-lines");

        // Try again and test "Leave without saving"
        cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
        cy.get("#ops-modal", { timeout: 10000 }).should("exist");
        cy.get("[data-cy='cancel-action']").click();
        cy.url().should("include", "/budget-lines");

        // Go back to Agreement Details and make changes again
        cy.get('[data-cy="details-tab-Agreement Details"]').click();
        cy.get("#edit").click();
        cy.get("#contract-type").select("Time & Materials (T&M)");
        cy.wait(500); // Wait for state to update

        // Try to navigate to Budget Lines and test "Save Changes"
        cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
        cy.get("#ops-modal", { timeout: 10000 }).should("exist");
        cy.get("[data-cy='confirm-action']").click();
        cy.get(".usa-alert__heading").should("contain", "Agreement Updated");
        cy.url().should("include", "/budget-lines");
    });

    it("should show and hide unsaved changes indicators correctly throughout workflow", () => {
        // Test Agreement Details tab
        cy.visit("/agreements/9");

        // Initially: no "Editing..." indicator
        cy.get("#editing").should("not.exist");

        // After edit click: "Editing..." appears
        cy.get("#edit").click();
        cy.get("#editing").should("have.text", "Editing...");

        // After making a change: "Editing..." still visible
        cy.get("#contract-type").select("Firm Fixed Price (FFP)");
        cy.wait(500); // Wait for state to update
        cy.get("#editing").should("have.text", "Editing...");

        // After save: indicator disappears
        cy.get('[data-cy="continue-btn"]').click();
        cy.get(".usa-alert__heading").should("contain", "Agreement Updated");
        cy.get("#editing").should("not.exist");

        // Test the same workflow on Budget Lines tab
        cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();

        // Initially: no indicators
        cy.get("#editing").should("not.exist");
        cy.get('[data-cy="unsaved-changes"]').should("not.exist");

        // After edit click: "Editing..." appears, no badge
        cy.get("#edit").click();
        cy.get("#editing").should("have.text", "Editing...");
        cy.get('[data-cy="unsaved-changes"]').should("not.exist");

        // After adding a budget line: both "Editing..." and badge appear
        cy.get("#add-budget-line").click();
        cy.get("#editing").should("have.text", "Editing...");
        cy.get('[data-cy="unsaved-changes"]').should("exist");

        // Cancel and verify both indicators disappear
        cy.get('[data-cy="cancel-button"]').click();
        cy.get("#ops-modal-heading").should("contain", "Are you sure you want to cancel editing?");
        cy.get('[data-cy="confirm-action"]').click();
        cy.get("#editing").should("not.exist");
        cy.get('[data-cy="unsaved-changes"]').should("not.exist");
    });

    it("should allow navigation without modal when edit mode is active but no changes made", () => {
        // Start fresh - login as system-owner
        testLogin("system-owner");
        cy.visit("/agreements/9");
        cy.wait(1000); // Wait for page to load

        // Click edit - "Editing..." appears
        cy.get("#edit").click();
        cy.get("#editing").should("have.text", "Editing...");

        // Navigate to Budget Lines - no modal should appear (no changes made)
        cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
        cy.get("#ops-modal", { timeout: 5000 }).should("not.exist");

        // Navigation should succeed
        cy.url().should("include", "/budget-lines");

        // Test the reverse: Budget Lines to Agreement Details
        cy.get("#editing").should("have.text", "Editing...");
        cy.get('[data-cy="unsaved-changes"]').should("not.exist");

        // Navigate to Agreement Details - no modal
        cy.get('[data-cy="details-tab-Agreement Details"]').click();
        cy.get("#ops-modal", { timeout: 5000 }).should("not.exist");
        cy.url().should("not.include", "/budget-lines");
    });
});
