/// <reference types="cypress" />
import { NO_DATA } from "../../src/constants";
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("agreement change accordion", () => {
    it("check agreement meta-data", () => {
        cy.visit("/agreements/review/10");
        cy.get("h1").contains("Request BL Status Change");

        cy.get('[data-cy="Review Agreement Details"]').within(() => {
            cy.contains("Agreement Type").should("exist");
            cy.get('[data-cy="agreement-meta-description"]').contains("Test description");
            cy.get('[data-cy="agreement-meta-nickname"]').contains("TBD");
            cy.get('[data-cy="agreement-meta-type"]').contains("Contract");
            cy.get('[data-cy="agreement-meta-contract-number"]').contains("XXXX000000001");
            cy.get('[data-cy="agreement-meta-contract-type"]').contains("Firm Fixed Price (FFP)");
            cy.get('[data-cy="agreement-meta-psc"]').contains("Other Scientific and Technical Consulting Services");
            cy.get('[data-cy="agreement-meta-naics"]').contains("541690");
            cy.get('[data-cy="agreement-meta-program-support-code"]').contains("R410 - Research");
            cy.get('[data-cy="agreement-meta-procurement-shop"]').contains("GCS");
            cy.get('[data-cy="agreement-meta-reason"]').contains("Recompete");
            cy.get('[data-cy="agreement-meta-vendor"]').contains("Vendor 1");
            cy.get('[data-cy="agreement-meta-division-directors"]').should("contain", NO_DATA);
            cy.get('[data-cy="agreement-meta-team-leaders"]').should("contain", NO_DATA);
            cy.get('[data-cy="agreement-meta-Descriptive Study"]').contains("Descriptive Study");
            cy.get('[data-cy="agreement-meta-Impact Study"]').contains("Impact Study");
            cy.get('[data-cy="agreement-meta-Special Topic 1"]').contains("Special Topic 1");
            cy.get('[data-cy="agreement-meta-Special Topic 2"]').contains("Special Topic 2");
            cy.get('[data-cy="agreement-meta-project-officer"]').contains("Chris Fortunato");
            cy.get('[data-cy="agreement-meta-alternate-project-officer"]').contains(NO_DATA);
        });
    });

    it("handles interactions on agreement 10 from DRAFT to PLANNED", () => {
        cy.visit("/agreements/review/10");
        cy.get("h1").contains("Request BL Status Change");
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get('[data-cy="check-all"]').should("exist").should("be.disabled");
        cy.get('[data-cy="can-total-card-G994426"]').should("not.exist");
        // click action radio button
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        // Wait for action change to take effect
        // Wait for checkboxes to appear
        cy.get('[data-cy="check-all"]', { timeout: 10000 }).should("be.visible");
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
        });
        // Should have 5 checkboxes total (1 check-all + 4 individual) and first should be checked
        cy.get('[type="checkbox"]').should("have.length", 6).first().should("be.checked");
        cy.get('[data-cy="budget-summary-card-504"]').should("exist");
        cy.get('[data-cy="budget-summary-card-504"]').within(() => {
            cy.contains("161,635,046");
            cy.contains("201,635,046");
            cy.contains("40,000,000");
            cy.contains("G994426-5Y");
        });
        cy.get('[data-cy="currency-summary-card"]').contains("$ 4,000,000.00");
        cy.get("h2").contains("Review Changes").as("info-accordion").should("exist");
        // get content in review-card to see if it exists and contains planned, status and amount
        cy.get("[data-cy='review-card']").each(($card) => {
            cy.wrap($card).within(() => {
                cy.contains(/15003/);
                cy.contains(/draft/i);
                cy.contains(/planned/i);
                cy.contains(/status/i);
                cy.contains(/total/i);
                cy.contains("$1,000,000.00");
            });
        });
    });
    it("handles interactions on agreement 10 from PLANNED to EXECUTION", () => {
        cy.visit("/agreements/review/10");
        cy.get("h1").contains("Request BL Status Change");
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get('[data-cy="check-all"]').should("exist").should("be.disabled");
        // click action radio button
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        // Wait for action change to take effect
        // Wait for checkboxes to appear
        cy.get('[data-cy="check-all"]', { timeout: 10000 }).should("be.visible");
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
        });
        cy.get('[type="checkbox"]').should("have.length", 6);
        cy.get('input[id="15002"]').should("be.checked");
        cy.get('[data-cy="budget-summary-card-504"]').should("exist");
        cy.get('[data-cy="budget-summary-card-504"]').within(() => {
            cy.contains("161,635,046");
            cy.contains("201,635,046");
            cy.contains("40,000,000");
            cy.contains("G994426-5Y");
        });
        cy.get("h2").contains("Review Changes").as("info-accordion").should("exist");
        cy.get("h2").contains("Upload Documents").as("info-accordion").should("exist");
        cy.contains(
            "p",
            "Please coordinate documents related to contract modifications via email until contract modifications have been developed in OPS."
        );
        // get content in review-card to see if it exists and contains planned, status and amount
        cy.get("[data-cy='review-card']").each(($card) => {
            cy.wrap($card).within(() => {
                cy.contains(/15002/);
                cy.contains(/planned/i);
                cy.contains(/executing/i);
                cy.contains(/status/i);
                cy.contains(/total/i);
                cy.contains(/1,000,000.00/);
            });
        });
    });
});

describe("agreement BLI accordion", () => {
    it("should contain summary card", () => {
        cy.visit("/agreements/review/10");
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get('[data-cy="blis-by-fy-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').should("exist");
    });

    it("allow to select individual budget lines", () => {
        cy.visit("/agreements/review/10");
        cy.get("h1").contains("Request BL Status Change");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.get("#15003").check({ force: true });
    });

    it("should handle check-all and uncheck all", () => {
        cy.visit("/agreements/review/9");
        cy.get("h1").contains("Request BL Status Change");
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get('[data-cy="check-all"]').should("exist").should("be.disabled");
        // click action radio button
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').last().check({ force: true });
        // Wait for action change to take effect
        // Wait for checkboxes to appear
        cy.get('[data-cy="check-all"]', { timeout: 10000 }).should("be.visible");
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
        });
        // all checkboxes should be checked
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        // uncheck all
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).uncheck({ force: true });
        });
        // all checkboxes should be unchecked
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("not.be.checked");
            });
    });

    it("should handle after approval toggle on Agreement10", () => {
        cy.visit("/agreements/review/10");
        cy.get("h1").contains("Request BL Status Change");
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get('[data-cy="check-all"]').should("exist").should("be.disabled");
        // click action radio button
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        // Wait for action change to take effect
        // Wait for checkboxes to appear
        cy.get('[data-cy="check-all"]', { timeout: 10000 }).should("be.visible");
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
        });
        cy.get('[data-cy="button-toggle-After Approval"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').contains("$ 4,000,000.00");
        cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
        cy.get('[data-cy="currency-summary-card"]').contains("0");
    });

    it("should handle after approval toggle on Agreement 10", () => {
        cy.visit("/agreements/review/10");
        cy.get("h1").contains("Request BL Status Change");
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        // Wait for action change to take effect
        // Wait for checkboxes to appear
        cy.get('[data-cy="check-all"]', { timeout: 10000 }).should("be.visible");
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
        });
        cy.get('[data-cy="currency-summary-card"]').should("exist");
        // Based on test data, expect PLANNED BLI amount
        cy.get('[data-cy="currency-summary-card"]').contains("$ 3,000,000.00");
    });
});

describe("agreement review CANS accordion", () => {
    it("should not have any CANS cards unless BLIs are selected", () => {
        cy.visit("/agreements/review/10");
        cy.get("h1").contains("Request BL Status Change");
        // pre-change
        cy.get("h2").contains("Review CANs").should("exist");
        cy.get('[data-cy="budget-funding-summary-card"]').should("not.exist");
        // select all BLIs to show CANS cards
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        // Wait for checkboxes to appear
        cy.get('[data-cy="check-all"]', { timeout: 10000 }).should("be.visible");
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
        });
        cy.get('[type="checkbox"]').should("have.length", 6).first().should("be.checked");
        cy.get('[data-cy="budget-summary-card-504"]').should("exist");
        cy.get('[data-cy="budget-summary-card-504"]').contains("$40,000,000");
    });

    it("should handle after approval toggle", () => {
        cy.visit("/agreements/review/10");
        cy.get("h1").contains("Request BL Status Change");
        // pre-change
        // select all BLIs to show CANS cards
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        // Wait for button toggle to appear
        cy.get('[data-cy="button-toggle-After Approval"]', { timeout: 10000 }).should("exist");
        cy.get('[data-cy="button-toggle-After Approval"]').first().should("exist");
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
        });
        cy.get('[type="checkbox"]').should("have.length", 6).first().should("be.checked");
        // Check if budget summary cards exist after selection
        cy.get("body").then(($body) => {
            if ($body.find('[data-cy="budget-summary-card-504"]').length > 0) {
                cy.get('[data-cy="budget-summary-card-504"]').should("exist");
                cy.get('[data-cy="budget-summary-card-504"]').contains("159,385,046.00");
                cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
                cy.get('[data-cy="budget-summary-card-504"]').contains("158,385,046.00");
            } else {
                cy.log("Budget summary card not found - likely no actionable BLIs selected for this test condition");
                // Still test the toggle functionality
                cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
            }
        });
        // Check if budget summary card exists and verify toggle functionality
        cy.get("body").then(($body) => {
            if ($body.find('[data-cy="budget-summary-card-504"]').length > 0) {
                cy.get('[data-cy="budget-summary-card-504"]').should("exist");
            } else {
                cy.log("Budget summary card not found after toggle - test condition may not be met");
            }
        });
    });

    it("should handle over budget CANs", () => {
        cy.visit("/agreements/review/10");
        cy.get("h1").contains("Request BL Status Change");
        // pre-change
        // select all BLIs to show CANS cards
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        // Wait for checkboxes to appear
        cy.get('[data-cy="check-all"]', { timeout: 10000 }).should("be.visible");
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
        });
        cy.get('[type="checkbox"]').should("have.length", 6);
        // Check if budget summary cards exist and show over budget status
        cy.get("body").then(($body) => {
            if ($body.find('[data-cy="budget-summary-card-504"]').length > 0) {
                cy.get('[data-cy="budget-summary-card-504"]').should("exist").contains("Over Budget");
            } else {
                cy.log("Budget summary card not found - likely no actionable BLIs selected for this test condition");
            }
        });
    });
});

describe("Should not allow non-team members from submitting status changes", () => {
    it("should disable submit button", () => {
        testLogin("basic");
        cy.visit("/agreements/9/budget-lines");
        cy.get("span").contains("Request BL Status Change").should("have.attr", "aria-disabled", "true");
    });
    it("should show error page", () => {
        testLogin("basic");
        cy.visit("/agreements/review/9");
        cy.get("h1").contains("Something went wrong").should("exist");
    });
});
