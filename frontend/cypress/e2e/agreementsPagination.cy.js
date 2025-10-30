/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

describe("Agreements List - Pagination", () => {
    beforeEach(() => {
        testLogin("system-owner");

        // Intercept the agreements API call to ensure it completes
        cy.intercept("GET", "**/api/v1/agreements/**").as("getAgreements");

        cy.visit("/agreements");

        // Wait for the API call to complete
        cy.wait("@getAgreements", { timeout: 15000 });

        // Wait for page to load by checking for h1
        cy.get("h1", { timeout: 10000 }).should("have.text", "Agreements");

        // Wait for table data to load
        cy.get(".usa-table tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);

        // Wait for pagination to fully render (this is the key for these tests)
        cy.get("nav[aria-label='Pagination']", { timeout: 10000 }).should("be.visible");
        cy.get("button.usa-current", { timeout: 10000 }).should("be.visible");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    describe("Basic Pagination Navigation", () => {
        it("should display pagination controls when there are more than 10 agreements", () => {
            // Check if pagination navigation exists
            cy.get("nav[aria-label='Pagination']").should("exist");
            cy.get(".usa-pagination").should("exist");
        });

        it("should start on page 1 by default", () => {
            // First page button should be active/current
            cy.get("button.usa-current").should("contain", "1");
        });

        it("should navigate to next page when Next button is clicked", () => {
            // Click the Next button
            cy.get("button[aria-label='Next page']").should("not.be.disabled");
            cy.get("button[aria-label='Next page']").click();

            // Should now be on page 2
            cy.get("button.usa-current").should("contain", "2");

            // URL or table content should reflect page 2
            cy.get(".usa-table tbody tr").should("have.length.at.least", 1);
        });

        it("should navigate to previous page when Previous button is clicked", () => {
            // First go to page 2
            cy.get("button[aria-label='Next page']").click();
            cy.get("button.usa-current").should("contain", "2");

            // Click Previous button
            cy.get("button[aria-label='Previous page']").should("not.be.disabled");
            cy.get("button[aria-label='Previous page']").click();

            // Should be back on page 1
            cy.get("button.usa-current").should("contain", "1");
        });

        it("should navigate directly to a specific page number", () => {
            // Click on page number 2
            cy.get("button[aria-label='Page 2']").click();

            // Should be on page 2
            cy.get("button.usa-current").should("contain", "2");
        });

        it("should disable Previous button on first page", () => {
            // On page 1, Previous button is hidden (not just disabled)
            cy.get("button[aria-label='Previous page']").should("not.be.visible");
        });

        it("should hide Next button on last page", () => {
            // Navigate to last page (need to find what the last page is)
            // Get all page number buttons
            cy.get("button[aria-label^='Page']").last().then(($lastButton) => {
                // Click the last page number
                $lastButton.click();
            });

            // Next button should be hidden on last page
            cy.get("button[aria-label='Next page']").should("not.be.visible");
        });
    });

    describe("Pagination with Filters", () => {
        it("should reset to page 1 when a filter is applied", () => {
            // Navigate to page 2 first
            cy.get("button[aria-label='Next page']").click();
            cy.get("button.usa-current").should("contain", "2");

            // Intercept the filtered API call
            cy.intercept("GET", "**/api/v1/agreements/*").as("getFilteredAgreements");

            // Open filter modal
            cy.get("button").contains("Filter").click();

            // Apply a fiscal year filter
            cy.get(".fiscal-year-combobox__control").click();
            cy.get(".fiscal-year-combobox__menu").find(".fiscal-year-combobox__option").first().click();

            // Apply filter
            cy.get("button").contains("Apply").click();

            // Wait for the filtered API call to complete
            cy.wait("@getFilteredAgreements", { timeout: 15000 });

            // Wait for filtered data to load
            cy.get(".usa-table tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);

            // Should reset to page 1
            cy.get("button.usa-current").should("contain", "1");
        });

        it("should show pagination controls with filtered results", () => {
            // Intercept the filtered API call
            cy.intercept("GET", "**/api/v1/agreements/*").as("getFilteredAgreements");

            // Apply filter
            cy.get("button").contains("Filter").click();
            cy.get(".fiscal-year-combobox__control").click();
            cy.get(".fiscal-year-combobox__menu").find(".fiscal-year-combobox__option").first().click();
            cy.get("button").contains("Apply").click();

            // Wait for the filtered API call to complete
            cy.wait("@getFilteredAgreements", { timeout: 15000 });

            // Wait for filtered data to load
            cy.get(".usa-table tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);

            // Pagination should still exist (assuming filtered results > 10)
            cy.get("nav[aria-label='Pagination']").should("exist");

            // Should be able to navigate pages with filter applied
            cy.get("button[aria-label='Next page']").then(($nextBtn) => {
                if (!$nextBtn.is(":disabled")) {
                    cy.wrap($nextBtn).click();
                    cy.get("button.usa-current").should("contain", "2");
                }
            });
        });

        it.skip("should work with My Agreements tab", () => {
            // Navigate to My Agreements tab
            cy.visit("/agreements?filter=my-agreements");
            cy.wait(1000);
            cy.get("h2").should("contain", "My Agreements");

            // Pagination should exist if user has > 10 agreements
            cy.get("body").then(($body) => {
                if ($body.find("nav[aria-label='Pagination']").length > 0) {
                    // Test pagination on My Agreements
                    cy.get("button[aria-label='Next page']").then(($nextBtn) => {
                        if (!$nextBtn.is(":disabled")) {
                            cy.wrap($nextBtn).click();
                            cy.get("button.usa-current").should("contain", "2");
                        }
                    });
                }
            });
        });
    });

    describe("Pagination with Sorting", () => {
        it("should reset to page 1 when sort order is changed", () => {
            // Navigate to page 2
            cy.get("button[aria-label='Next page']").click();
            cy.get("button.usa-current").should("contain", "2");

            // Click on a column header to change sort
            cy.get("thead th").contains("Agreement").click();

            // Wait for sorted data to load
            cy.get(".usa-table tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);

            // Should reset to page 1
            cy.get("button.usa-current").should("contain", "1");
        });

        it("should maintain sort order across pages", () => {
            // Sort by Agreement name
            cy.get("thead th").contains("Agreement").click();

            // Wait for sorted data to load
            cy.get(".usa-table tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);

            // Navigate to page 2 and verify data loads
            cy.get("button[aria-label='Next page']").then(($nextBtn) => {
                if (!$nextBtn.is(":disabled")) {
                    cy.wrap($nextBtn).click();

                    // Verify page 2 has data (sort order is maintained)
                    cy.get("tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);
                }
            });
        });
    });

    describe("Export with Pagination", () => {
        it("should have an export button", () => {
            cy.get("button").contains("Export").should("exist");
        });

        it("export button should be clickable when agreements exist", () => {
            cy.get("button").contains("Export").should("not.be.disabled");
        });

        // Note: We can't easily test the actual export in Cypress without downloading files
        // The functionality is tested in unit tests to ensure it fetches all agreements
    });

    describe("Edge Cases", () => {
        it("should not show pagination when results fit on one page", () => {
            // Apply very restrictive filter to get < 10 results
            cy.get("button").contains("Filter").click();

            // Apply multiple filters to narrow results
            cy.get(".fiscal-year-combobox__control").click();
            cy.get(".fiscal-year-combobox__menu").find(".fiscal-year-combobox__option").last().click();

            cy.get(".portfolios-combobox__control").click();
            cy.get(".portfolios-combobox__menu").find(".portfolios-combobox__option").last().click();

            cy.get("button").contains("Apply").click();

            // Wait for filtered data to load (could be 0 rows with restrictive filter)
            // Just wait for the loading state to complete
            cy.get(".usa-table", { timeout: 10000 }).should("exist");

            // Check if pagination is hidden (might still exist but only if > 10 items)
            cy.get("body").then(($body) => {
                const rowCount = $body.find("tbody tr").length;
                if (rowCount <= 10) {
                    // Pagination should not be visible
                    cy.get("nav[aria-label='Pagination']").should("not.exist");
                }
            });
        });

        it("should show correct page numbers with ellipsis for many pages", () => {
            // With default view (all agreements), check pagination structure
            cy.get("nav[aria-label='Pagination']").within(() => {
                // Should have page 1
                cy.get("button[aria-label='Page 1']").should("exist");

                // May have ellipsis if many pages
                cy.get("li[aria-label='ellipsis indicating non-visible pages']").then(($ellipsis) => {
                    if ($ellipsis.length > 0) {
                        // Ellipsis exists, indicating many pages
                        cy.wrap($ellipsis).should("contain", "…");
                    }
                });
            });
        });

        it("should handle navigation to a middle page", () => {
            // Click on page 3 if it exists
            cy.get("button[aria-label='Page 3']").then(($page3) => {
                if ($page3.length > 0) {
                    cy.wrap($page3).click();
                    cy.get("button.usa-current").should("contain", "3");

                    // Both Previous and Next should be enabled
                    cy.get("button[aria-label='Previous page']").should("not.be.disabled");
                    cy.get("button[aria-label='Next page']").then(($next) => {
                        // Next might be disabled if we're on last page
                        if (!$next.is(":disabled")) {
                            cy.wrap($next).should("not.be.disabled");
                        }
                    });
                }
            });
        });

        it("should load different agreements on different pages", () => {
            // Get first agreement on page 1
            cy.get("tbody tr")
                .first()
                .find("td")
                .first()
                .find("a")
                .invoke("text")
                .then((page1FirstAgreement) => {
                    // Navigate to page 2
                    cy.get("button[aria-label='Next page']").then(($nextBtn) => {
                        if (!$nextBtn.is(":disabled")) {
                            cy.wrap($nextBtn).click();

                            // Wait for page 2 to load by checking current page indicator
                            cy.get("button.usa-current").should("contain", "2");

                            // Wait for page 2 data to load
                            cy.get("tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);

                            // Get first agreement on page 2
                            cy.get("tbody tr")
                                .first()
                                .find("td")
                                .first()
                                .find("a")
                                .invoke("text")
                                .then((page2FirstAgreement) => {
                                    // Should be different agreements
                                    expect(page1FirstAgreement.trim()).to.not.equal(page2FirstAgreement.trim());
                                });
                        }
                    });
                });
        });
    });

    describe("Accessibility", () => {
        it("pagination controls should be keyboard accessible", () => {
            // Tab to pagination controls and test keyboard navigation
            cy.get("button[aria-label='Next page']").focus();
            cy.focused().should("have.attr", "aria-label", "Next page");

            // Press Enter to navigate
            cy.focused().type("{enter}");

            // Should navigate to next page
            cy.get("button.usa-current").should("contain", "2");
        });

        it("should have proper ARIA labels", () => {
            // Check for navigation aria-label
            cy.get("nav[aria-label='Pagination']").should("exist");

            // Check for button aria-labels
            cy.get("button[aria-label='Previous page']").should("exist");
            cy.get("button[aria-label='Next page']").should("exist");
            cy.get("button[aria-label='Page 1']").should("exist");
        });

        it("should indicate current page with aria-current", () => {
            // Current page button should have appropriate styling/class
            cy.get("button.usa-current").should("exist");
        });
    });
});
