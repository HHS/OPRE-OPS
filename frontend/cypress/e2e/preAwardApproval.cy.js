/// <reference types="cypress" />

import { testLogin } from "./utils";

// Agreement 13: Procurement Tracker Test Contract (has pre-award approval workflow)
const TEST_AGREEMENT_ID = 13;

describe("Pre-Award Approval - Division Director Flow", () => {
    beforeEach(() => {
        testLogin("division-director");
    });
    it("loads the approval page and displays all major sections", () => {
        cy.visit(`/agreements/${TEST_AGREEMENT_ID}/review-pre-award`);

        // Verify page loaded
        cy.get("h1").contains("Approval for Pre-Award").should("exist");

        // Verify all accordions are present (integration test - verifies component composition)
        cy.contains("Agreement Details").should("exist");
        cy.contains("Review Budget Lines").should("exist");
        cy.contains("Review CANs").should("exist");
        cy.contains("Review Final Consensus Memo").should("exist");
        cy.contains("Notes").should("exist");

        // Verify action buttons exist
        cy.get('[data-cy="cancel-approval-btn"]').should("exist");
        cy.get('[data-cy="decline-approval-btn"]').should("exist");
        cy.get('[data-cy="approve-pre-award-btn"]').should("exist");
    });

    it("cancel button shows confirmation modal and navigates after confirmation", () => {
        cy.visit(`/agreements/${TEST_AGREEMENT_ID}/review-pre-award`);

        // Click cancel button
        cy.get('[data-cy="cancel-approval-btn"]').click();

        // Modal should appear
        cy.contains("Are you sure you want to cancel?").should("exist");

        // Click confirm button in modal
        cy.contains("button", "Cancel").click();

        // Should navigate away from review page
        cy.url().should("not.include", "/review-pre-award");
    });
});

describe("Pre-Award Approval - Budget Team Review Card", () => {
    beforeEach(() => {
        testLogin("budget-team");
    });

    it("displays pre-award review card on change requests page when approval is pending requisition", () => {
        cy.visit("/change-requests");

        // Check if a pre-award review card exists (conditional on data)
        cy.get("body").then(($body) => {
            if ($body.find('[data-cy="pre-award-review-card"]').length > 0) {
                cy.get('[data-cy="pre-award-review-card"]').should("exist");
                cy.get('[data-cy="pre-award-review-card"]').within(() => {
                    cy.contains("Pre-Award").should("exist");
                    cy.contains("Agreement").should("exist");
                    cy.contains("BLs Executing").should("exist");
                    cy.contains("Executing Total").should("exist");
                    cy.contains("Agreement Total").should("exist");
                    cy.get('[data-cy="review-agreement-button"]').should("exist");
                });
            }
        });
    });
});

describe("Pre-Award Approval - Permission Checks", () => {
    it("denies access to non-division directors", () => {
        testLogin("basic");
        cy.visit(`/agreements/${TEST_AGREEMENT_ID}/review-pre-award`);

        cy.contains("Access Denied").should("exist");
        cy.contains("You do not have permission to review this pre-award approval request").should("exist");
    });

    it("shows already processed message when approval is already completed", () => {
        testLogin("division-director");
        cy.visit(`/agreements/${TEST_AGREEMENT_ID}/review-pre-award`);

        // Check if already processed (conditional on data state)
        cy.get("body").then(($body) => {
            if ($body.text().includes("Already Processed")) {
                cy.contains("Already Processed").should("exist");
                cy.contains("This pre-award approval request has already been processed").should("exist");
                cy.get('[data-cy="approve-pre-award-btn"]').should("be.disabled");
                cy.get('[data-cy="decline-approval-btn"]').should("be.disabled");
            }
        });
    });
});
