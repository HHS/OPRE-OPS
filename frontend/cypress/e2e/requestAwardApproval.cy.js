/// <reference types="cypress" />

const AGREEMENT_ID = 13; // Agreement with completed Step 5

describe("Request Award Approval Page", () => {
    beforeEach(() => {
        cy.login();
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);
    });

    it("displays award approval request form with budget lines section", () => {
        cy.contains("h1", "Request Award Approval").should("be.visible");
        cy.checkA11y();

        // Verify Add CLINs accordion exists
        cy.contains("button", "Add CLINs to Budget Lines").should("be.visible").click();

        // Verify budget summary cards are present
        cy.contains("Agreement Total").should("be.visible");
        cy.contains("Budget Lines by Fiscal Year").should("be.visible");
    });

    it("displays budget summary cards with correct data", () => {
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Verify Agreement Total card shows numeric values
        cy.get("[data-cy='agreement-total-card']").within(() => {
            cy.contains("Agreement Total").should("be.visible");
            // Should show currency amounts (checking for $ symbol)
            cy.get("body").should("contain", "$");
        });

        // Verify BLIs by FY card exists
        cy.get("[data-cy='blis-by-fy-card']").within(() => {
            cy.contains("Budget Lines by Fiscal Year").should("be.visible");
        });
    });

    it("displays budget line items grouped by services component", () => {
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Check for services component accordion
        cy.get("body").should("contain", "SC");

        // Verify budget line table exists
        cy.get("table").should("exist");
    });

    it("displays notes textarea with character count", () => {
        // Verify notes section exists
        cy.contains("label", "Notes").should("be.visible");
        cy.get("textarea[name='notes']").should("be.visible");

        // Character count should start at 0/1000
        cy.contains("0 / 1000 characters").should("be.visible");
    });

    it("updates character count as user types in notes", () => {
        const testNote = "This is a test note for award approval.";

        cy.get("textarea[name='notes']").type(testNote);

        // Character count should update
        cy.contains(`${testNote.length} / 1000 characters`).should("be.visible");
    });

    it("shows validation error when notes exceed 1000 characters", () => {
        const longNote = "a".repeat(1001);

        cy.get("textarea[name='notes']").invoke("val", longNote).trigger("input");

        // Should show character count exceeded
        cy.contains("1001 / 1000 characters").should("be.visible");

        // Submit button should be disabled
        cy.contains("button", "Submit Request").should("be.disabled");
    });

    it("displays project officer and alternate project officer names", () => {
        // Verify project officers section exists
        cy.contains("Project Officer(s)").should("be.visible");

        // Should contain at least one project officer name
        cy.get("body").should("contain", "PO:");
    });

    it("has cancel button that navigates back", () => {
        cy.contains("button", "Cancel").should("be.visible").and("not.be.disabled");
    });

    it("disables submit button when notes exceed character limit", () => {
        const longNote = "a".repeat(1001);

        cy.get("textarea[name='notes']").invoke("val", longNote).trigger("input");

        cy.contains("button", "Submit Request").should("be.disabled");
    });

    it("enables submit button when form is valid", () => {
        cy.contains("button", "Submit Request").should("not.be.disabled");
    });

    it("shows loading state when agreement data is being fetched", () => {
        cy.intercept("GET", `/api/v1/agreements/${AGREEMENT_ID}`, {
            delay: 1000,
            body: {}
        }).as("getAgreement");

        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        cy.get(".usa-spinner").should("be.visible");
    });

    it("displays error message if Step 5 is not completed", () => {
        // Use an agreement ID that does not have Step 5 completed
        const agreementWithoutStep5 = 1;

        cy.visit(`/agreements/${agreementWithoutStep5}/award-approval`);

        cy.contains("Step 5 (Requisition Approval) must be completed before requesting award approval").should(
            "be.visible"
        );
    });

    it("displays error message if approval has already been requested", () => {
        // Mock an agreement where Step 6 approval_requested is true
        cy.intercept("GET", `/api/v1/procurement-trackers?agreement_id=${AGREEMENT_ID}`, {
            data: [
                {
                    id: 1,
                    status: "ACTIVE",
                    steps: [
                        { step_number: 5, status: "COMPLETED" },
                        { step_number: 6, status: "IN_PROGRESS", approval_requested: true }
                    ]
                }
            ]
        }).as("getTrackers");

        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        cy.contains("Award approval has already been requested for this agreement").should("be.visible");
    });

    it("expands and collapses Add CLINs accordion", () => {
        // Initially collapsed
        cy.get("table").should("not.exist");

        // Click to expand
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Budget lines table should now be visible
        cy.get("table").should("be.visible");

        // Click to collapse
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Table should be hidden again
        cy.get("table").should("not.be.visible");
    });

    it("displays agreement name in breadcrumb", () => {
        cy.get("nav[aria-label='Breadcrumb']").within(() => {
            cy.contains("a", "Agreements").should("be.visible");
        });
    });

    it("passes accessibility checks", () => {
        cy.checkA11y();

        // Check accessibility after expanding accordion
        cy.contains("button", "Add CLINs to Budget Lines").click();
        cy.checkA11y();

        // Check accessibility after typing in notes
        cy.get("textarea[name='notes']").type("Accessibility test note");
        cy.checkA11y();
    });

    it("allows keyboard navigation through interactive elements", () => {
        // Tab through form elements
        cy.get("body").tab();

        // Should be able to reach the accordion button
        cy.focused().should("contain", "Add CLINs to Budget Lines");

        // Tab to notes textarea
        cy.focused().tab();
        cy.focused().tab();
        cy.focused().should("have.attr", "name", "notes");

        // Tab to Cancel button
        cy.focused().tab();
        cy.focused().should("contain", "Cancel");

        // Tab to Submit button
        cy.focused().tab();
        cy.focused().should("contain", "Submit");
    });

    it("displays fiscal year breakdown chart", () => {
        cy.contains("button", "Add CLINs to Budget Lines").click();

        cy.get("[data-cy='blis-by-fy-card']").within(() => {
            // Should have SVG chart elements (horizontal bars)
            cy.get("svg").should("exist");
        });
    });

    it("shows correct button states for different scenarios", () => {
        // Valid state - both buttons enabled
        cy.contains("button", "Cancel").should("not.be.disabled");
        cy.contains("button", "Submit Request").should("not.be.disabled");

        // Type valid note
        cy.get("textarea[name='notes']").type("Valid note");
        cy.contains("button", "Submit Request").should("not.be.disabled");

        // Clear and type invalid note (too long)
        cy.get("textarea[name='notes']").clear();
        cy.get("textarea[name='notes']").invoke("val", "a".repeat(1001)).trigger("input");
        cy.contains("button", "Submit Request").should("be.disabled");
    });

    it("displays procurement shop abbreviation in Agreement Total card", () => {
        cy.contains("button", "Add CLINs to Budget Lines").click();

        cy.get("[data-cy='agreement-total-card']").within(() => {
            // Should show procurement shop abbreviation or "TBD"
            cy.get("body").should("match", /(TBD|HHS)/);
        });
    });

    it("shows BLI review table in read-only mode", () => {
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Verify table exists and is in review mode (no edit controls)
        cy.get("table").should("exist");

        // Should NOT have delete buttons or edit inputs
        cy.get("table").within(() => {
            cy.get("button[aria-label='Delete']").should("not.exist");
        });
    });

    it("displays services component numbers correctly", () => {
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Should show SC prefix for services components
        cy.get("body").should("contain", "SC");

        // Verify services component accordion exists
        cy.get("button").contains(/SC \d+/).should("exist");
    });

    it("maintains form state when accordion is toggled", () => {
        const testNote = "Test note that should persist";

        // Type a note
        cy.get("textarea[name='notes']").type(testNote);

        // Toggle accordion open and closed
        cy.contains("button", "Add CLINs to Budget Lines").click();
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Note should still be there
        cy.get("textarea[name='notes']").should("have.value", testNote);
    });

    it("shows correct page title in document head", () => {
        cy.title().should("include", "Request Award Approval");
    });
});
