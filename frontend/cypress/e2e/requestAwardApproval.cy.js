/**
 * E2E tests for Request Award Approval workflow
 *
 * Critical user journey: Requester navigates from Step 6 to award approval form,
 * reviews agreement details, budget line items, and requests approval from Budget Team.
 */

const AGREEMENT_ID = 13; // Agreement with completed Step 5

describe("Request Award Approval", () => {
    beforeEach(() => {
        cy.FakeAuth("system-owner");
    });

    it("displays award approval request form with budget lines section", () => {
        // Navigate to award approval form from procurement tracker Step 6
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Verify page header
        cy.contains("h1", "Request Award Approval").should("be.visible");
        cy.checkA11y();

        // Verify Review Agreement Details accordion
        cy.contains("button", "Review Agreement Details").should("be.visible");

        // Verify Add CLINs to Budget Lines section with budget cards
        cy.contains("button", "Add CLINs to Budget Lines").should("be.visible").click();

        // Check for Agreement Total Card
        cy.contains("Agreement Total").should("be.visible");
        cy.contains("Agreement Subtotal").should("be.visible");
        cy.contains("Fees").should("be.visible");
        cy.contains("Procurement Shop").should("be.visible");

        // Check for Budget Lines by FY Card
        cy.contains("Budget Lines by Fiscal Year").should("be.visible");

        // Verify budget lines are grouped by services component
        cy.contains("BLs not associated with a Services Component").should("be.visible").click();

        // Verify budget line table with columns
        cy.contains("th", "BL ID #").should("be.visible");
        cy.contains("th", "Obligate By").should("be.visible");
        cy.contains("th", "FY").should("be.visible");
        cy.contains("th", "CAN").should("be.visible");
        cy.contains("th", "Amount").should("be.visible");
        cy.contains("th", "Fee").should("be.visible");
        cy.contains("th", "Total").should("be.visible");
        cy.contains("th", "Status").should("be.visible");

        // Verify Notes textarea
        cy.get("textarea[name='notes']").should("be.visible");

        // Verify action buttons
        cy.contains("button", "Cancel").should("be.visible");
        cy.contains("button", "Request Award Approval").should("be.visible");
    });

    it("allows user to expand and review budget lines by services component", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Open Add CLINs accordion
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Expand services component accordion
        cy.contains("BLs not associated with a Services Component").click();

        // Verify budget line data is displayed
        cy.get("table tbody tr").should("have.length.greaterThan", 0);

        // Verify budget line has expected columns populated
        cy.get("table tbody tr").first().within(() => {
            cy.get("td").should("have.length.greaterThan", 5);
        });
    });

    it("displays warning when Step 5 is not completed", () => {
        // Use agreement where Step 5 is not complete
        const AGREEMENT_WITHOUT_STEP_5 = 1;
        cy.visit(`/agreements/${AGREEMENT_WITHOUT_STEP_5}/award-approval`);

        // Verify warning alert
        cy.contains("Step 5 Not Completed").should("be.visible");
        cy.contains("Step 5 (Pre-Award) must be completed").should("be.visible");

        // Verify submit button is disabled
        cy.contains("button", "Request Award Approval").should("be.disabled");
    });

    it("allows user to add optional notes", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Type notes
        const testNotes = "CLINs have been verified and entered correctly.";
        cy.get("textarea[name='notes']").type(testNotes);
        cy.get("textarea[name='notes']").should("have.value", testNotes);

        // Verify character limit
        cy.get("textarea[name='notes']").invoke("attr", "maxlength").should("eq", "750");
    });

    it("validates notes character limit", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Type notes exceeding limit
        const longNotes = "A".repeat(800);
        cy.get("textarea[name='notes']").type(longNotes);

        // Verify error message appears
        cy.contains("Notes must be 750 characters or less").should("be.visible");
    });

    it("navigates back when Cancel is clicked", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Click Cancel
        cy.contains("button", "Cancel").click();

        // Verify navigation occurred (back to previous page)
        cy.url().should("not.include", "/award-approval");
    });

    it("displays instructional text about CLINs", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Open accordion to see instructions
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Verify instructional text
        cy.contains("Hover over each budget line and click Add CLIN").should("be.visible");
        cy.contains("The budget team will double check the CLINs match the award exactly").should("be.visible");
    });

    it("shows agreement metadata in review section", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Expand agreement details
        cy.contains("button", "Review Agreement Details").click();

        // Verify agreement fields are visible
        cy.contains("Project").should("be.visible");
        cy.contains("Agreement").should("be.visible");
        cy.contains("Agreement Type").should("be.visible");
        cy.contains("Service Requirement Type").should("be.visible");
    });

    it("meets accessibility standards", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Check accessibility on initial load
        cy.checkA11y();

        // Open accordions and check again
        cy.contains("button", "Review Agreement Details").click();
        cy.checkA11y();

        cy.contains("button", "Add CLINs to Budget Lines").click();
        cy.checkA11y();
    });
});
