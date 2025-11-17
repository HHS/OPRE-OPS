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
        cy.get('[data-cy="alert"]').contains(
            "Contracts that are awarded have not been fully developed yet, but are coming soon."
        );
        cy.get('[data-cy="close-alert"]').click();
        cy.get("h1").contains("MIHOPE Check-In");
        cy.get("h2").first().contains("Mother and Infant Home Visiting Program Evaluation 2");
        cy.get('[data-cy="details-tab-Award & Modifications"]').should("be.disabled");
        cy.get('[data-cy="details-tab-Procurement Tracker"]').should("be.disabled");
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
        cy.get('[data-cy="alternate-project-officer-tag"]').contains("Dave Director");
        cy.get("h3").contains("Notes");
        cy.get("p.font-12px").contains("There are currently no notes for this agreement.");
    });

    it("AA type agreement loads with details", () => {
        cy.visit("/agreements/5");
        cy.get("h1").contains("AA #1: Fathers and Continuous Learning (FCL)");
        cy.get("h2").first().contains("Annual Performance Plans and Reports");
        cy.get("h2").eq(1).contains("Agreement Details");

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
            cy.get('[data-cy="special-topic-tag"]').should("contain", "Special Topic 4");
            cy.contains("Division Director(s)").should("exist");
            cy.get('[data-cy="division-director-tag-no-data"]').should("exist");
            cy.contains("Team Leader(s)").should("exist");
            cy.get('[data-cy="team-leader-tag-no-data"]').should("exist");
            cy.contains("COR").should("exist");
            cy.get('[data-cy="project-officer-tag"]').should("contain", "Chris Fortunato");
            cy.contains("Alternate COR").should("exist");
            cy.get('[data-cy="alternate-project-officer-tag"]').should("contain", NO_DATA);
            cy.contains("Team Members").should("exist");
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
            "Agreements that are grants, inter-agency agreements (IAAs), assisted acquisitions (AAs) or direct obligations have not been developed yet, but are coming soon."
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
            "Agreements that are grants, inter-agency agreements (IAAs), assisted acquisitions (AAs) or direct obligations have not been developed yet, but are coming soon."
        );
        cy.get('[data-cy="close-alert"]').click();
        cy.get("#edit").should("not.exist");
    });

    it("IAAs load with temp banner", () => {
        cy.visit("/agreements/4");
        cy.get('[data-cy="alert"]').contains(
            "Agreements that are grants, inter-agency agreements (IAAs), assisted acquisitions (AAs) or direct obligations have not been developed yet, but are coming soon."
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
});
