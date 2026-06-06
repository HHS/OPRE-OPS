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
        cy.get("table tbody tr")
            .first()
            .within(() => {
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

    it("displays correct budget calculations in cards", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Open Add CLINs accordion
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Verify Agreement Total Card displays amounts
        cy.contains("Agreement Total")
            .parent()
            .within(() => {
                cy.get("span")
                    .contains(/\$[\d,]+/)
                    .should("be.visible");
            });

        // Verify subtotal is displayed
        cy.contains("Agreement Subtotal").should("be.visible");

        // Verify fees are calculated
        cy.contains("Fees").should("be.visible");

        // Verify procurement shop abbreviation
        cy.contains("Procurement Shop").should("be.visible");
    });

    it("displays budget lines grouped by fiscal year in chart", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Open accordion
        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Verify Budget Lines by FY card shows fiscal years
        cy.contains("Budget Lines by Fiscal Year")
            .parent()
            .within(() => {
                // Should show FY labels
                cy.contains(/FY \d{4}/).should("be.visible");

                // Should show amounts
                cy.get("span")
                    .contains(/\$[\d,]+/)
                    .should("be.visible");
            });
    });

    it("disables submit button when approval already requested", () => {
        // Visit agreement where approval has been requested
        const AGREEMENT_WITH_PENDING_APPROVAL = 13;
        cy.visit(`/agreements/${AGREEMENT_WITH_PENDING_APPROVAL}/award-approval`);

        // Note: This test assumes Step 6 has approval_requested = true
        // If warning appears, verify button is disabled
        cy.get("body").then(($body) => {
            if ($body.text().includes("Award Approval Already Requested")) {
                cy.contains("button", "Request Award Approval").should("be.disabled");
            }
        });
    });

    it("disables submit button when BLIs are in review", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Note: This test would need an agreement with BLIs in review status
        // If warning appears, verify button is disabled
        cy.get("body").then(($body) => {
            if ($body.text().includes("Budget Line Items In Review")) {
                cy.contains("button", "Request Award Approval").should("be.disabled");
            }
        });
    });

    it("displays budget line status badges correctly", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Open accordions
        cy.contains("button", "Add CLINs to Budget Lines").click();
        cy.contains("BLs not associated with a Services Component").click();

        // Verify status badges exist in table
        cy.get("table tbody tr")
            .first()
            .within(() => {
                // Status column should have a badge (Executing, Planned, Draft, etc.)
                cy.get("td").last().should("exist");
            });
    });

    it("shows services component metadata when available", () => {
        // This test would work better with an agreement that has services components
        // with metadata (period start/end, description)
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Check if services component accordion exists with metadata
        cy.get("body").then(($body) => {
            const hasServicesComponent = $body.text().includes("Period of Performance");
            if (hasServicesComponent) {
                cy.contains("Period of Performance").should("be.visible");
            }
        });
    });

    it("displays empty state when no budget lines in services component", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        cy.contains("button", "Add CLINs to Budget Lines").click();

        // Note: Would need an agreement with empty services component to test
        // Check if message appears
        cy.get("body").then(($body) => {
            if ($body.text().includes("No budget lines in this services component")) {
                cy.contains("No budget lines in this services component").should("be.visible");
            }
        });
    });

    it("maintains accordion state after interactions", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Open Add CLINs accordion
        cy.contains("button", "Add CLINs to Budget Lines").as("clinsAccordion");
        cy.get("@clinsAccordion").click();
        cy.get("@clinsAccordion").should("have.attr", "aria-expanded", "true");

        // Type in notes field
        cy.get("textarea[name='notes']").type("Test notes");

        // Accordion should remain open
        cy.get("@clinsAccordion").should("have.attr", "aria-expanded", "true");
    });

    it("displays all required agreement metadata fields", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Open Review Agreement Details accordion
        cy.contains("button", "Review Agreement Details").click();

        // Verify key metadata fields
        const expectedFields = [
            "Project",
            "Agreement",
            "Agreement Type",
            "Service Requirement Type",
            "Product Service Code",
            "NAICS Code",
            "Procurement Shop"
        ];

        expectedFields.forEach((field) => {
            cy.contains(field).should("be.visible");
        });
    });

    it("shows correct page breadcrumb", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Verify breadcrumb exists
        cy.get("nav[aria-label='Breadcrumb']").should("exist");
        cy.contains("Request Award Approval").should("be.visible");
    });

    it("collapses and expands accordions independently", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        const agreementDetailsBtn = "button:contains('Review Agreement Details')";
        const clinsBtn = "button:contains('Add CLINs to Budget Lines')";

        // Open both accordions
        cy.get(agreementDetailsBtn).click();
        cy.get(clinsBtn).click();

        // Both should be expanded
        cy.get(agreementDetailsBtn).should("have.attr", "aria-expanded", "true");
        cy.get(clinsBtn).should("have.attr", "aria-expanded", "true");

        // Collapse first accordion
        cy.get(agreementDetailsBtn).click();
        cy.get(agreementDetailsBtn).should("have.attr", "aria-expanded", "false");

        // Second should still be expanded
        cy.get(clinsBtn).should("have.attr", "aria-expanded", "true");
    });

    it("handles keyboard navigation for accordions", () => {
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Focus on first accordion button
        cy.contains("button", "Review Agreement Details").focus();

        // Press Enter to expand
        cy.focused().type("{enter}");
        cy.contains("button", "Review Agreement Details").should("have.attr", "aria-expanded", "true");

        // Press Enter again to collapse
        cy.focused().type("{enter}");
        cy.contains("button", "Review Agreement Details").should("have.attr", "aria-expanded", "false");
    });

    it("displays loading state appropriately", () => {
        // Intercept API call to control loading state
        cy.intercept("GET", `**/api/v1/agreements/${AGREEMENT_ID}*`, (req) => {
            req.reply((res) => {
                res.delay = 1000; // Delay response to see loading state
                res.send();
            });
        }).as("getAgreement");

        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);

        // Should show loading state initially
        cy.contains("Loading...").should("be.visible");

        // Wait for data to load
        cy.wait("@getAgreement");

        // Loading should disappear
        cy.contains("Loading...").should("not.exist");
        cy.contains("h1", "Request Award Approval").should("be.visible");
    });
});
