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

describe("Pre-Award Approval - Permission Checks", () => {
    it("denies access to non-division directors", () => {
        testLogin("basic");
        cy.visit(`/agreements/${TEST_AGREEMENT_ID}/review-pre-award`);

        cy.contains("Access Denied").should("exist");
        cy.contains("You do not have permission to review this pre-award approval request").should("exist");
    });
});
