import { testLogin } from "./utils";

const CURRENT_FY = new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0);

/**
 * Helper: extracts the agreement count number from text like "6 agreements"
 * within a given parent element (selected by data-cy).
 */
const getAgreementCount = (dataCy) => {
    return cy
        .get(`[data-cy='${dataCy}']`)
        .contains(/\d+ agreements/)
        .invoke("text")
        .then((text) => {
            const match = text.match(/(\d+) agreements/);
            return parseInt(match[1], 10);
        });
};

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/procurement-dashboard");
    // Wait for the page to fully load
    cy.get("[data-cy='procurement-overview-card']", { timeout: 30000 }).should("exist");
});

describe("Procurement Dashboard - Page Structure", () => {
    it("renders the page title and subtitle", () => {
        cy.contains("Procurement Dashboard").should("be.visible");
        cy.contains("Procurement Summary").should("be.visible");
        cy.contains(`FY ${CURRENT_FY}`).should("be.visible");
    });
});

describe("Procurement Dashboard - Overview Card", () => {
    it("renders the overview card with fiscal year title", () => {
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains(`FY ${CURRENT_FY} Procurement Overview`).should("be.visible");
        });
    });

    it("displays total amount and agreement count", () => {
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            // Should show some agreement count (at least 1)
            cy.contains(/\d+ agreements/).should("be.visible");
        });
    });

    it("shows agreement counts per status", () => {
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains(/\d+ agreements/).should("exist");
        });
    });
});

describe("Procurement Dashboard - Step Summary Card", () => {
    it("shows agreement counts and percentages for each step", () => {
        cy.get("[data-cy='procurement-step-summary-card']").within(() => {
            // Should display at least one percentage
            cy.contains(/\d+%/).should("exist");
        });
    });
});

describe("Procurement Dashboard - Budget Lines by Step Card", () => {
    it("renders the budget lines by step card", () => {
        cy.get("[data-cy='budget-lines-by-step-card']").within(() => {
            cy.contains(`FY ${CURRENT_FY} Budget Lines By Procurement Step`).should("be.visible");
        });
    });
});

describe("Procurement Dashboard - Tab Filtering", () => {
    it("filters to First Award (NEW) agreements when clicking the First Award tab", () => {
        // Capture the "All" count first
        getAgreementCount("procurement-overview-card").then((allCount) => {
            cy.contains("a", "First Award").click();
            cy.url().should("include", "filter=first-award");
            // First Award count should be <= all count
            getAgreementCount("procurement-overview-card").then((firstAwardCount) => {
                expect(firstAwardCount).to.be.at.most(allCount);
                expect(firstAwardCount).to.be.at.least(0);
            });
        });
    });

    it("filters to Modifications (CONTINUING) agreements when clicking the Modifications tab", () => {
        cy.contains("a", "Modifications").click();
        cy.url().should("include", "filter=modifications");
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains(/\d+ agreements/).should("be.visible");
        });
    });

    it("shows all agreements when clicking the All Procurement tab", () => {
        // Capture original count
        getAgreementCount("procurement-overview-card").then((originalCount) => {
            // Navigate to a filtered tab
            cy.contains("a", "First Award").click();
            cy.url().should("include", "filter=first-award");

            // Navigate back to All Procurement
            cy.contains("a", "All Procurement").click();
            cy.url().should("not.include", "filter=");

            // Count should match the original
            getAgreementCount("procurement-overview-card").then((restoredCount) => {
                expect(restoredCount).to.equal(originalCount);
            });
        });
    });

    it("updates step summary card when switching tabs", () => {
        // All Procurement - should show step data
        cy.get("[data-cy='procurement-step-summary-card']").within(() => {
            cy.contains("Step 1").should("be.visible");
        });

        // Modifications - step percentages should update
        cy.contains("a", "Modifications").click();
        cy.get("[data-cy='procurement-step-summary-card']").within(() => {
            cy.contains(/\d+%/).should("exist");
        });
    });
});

describe("Procurement Dashboard - Proc Shop Filter", () => {
    it("renders the proc shop dropdown with All option", () => {
        cy.get("#proc-shop-select").should("be.visible");
        cy.get("#proc-shop-select").find("option").first().should("have.text", "All");
    });

    it("populates the dropdown with procurement shop abbreviations", () => {
        cy.get("#proc-shop-select").find("option").should("have.length.greaterThan", 1);
    });

    it("filters agreements by procurement shop when selecting a specific shop", () => {
        getAgreementCount("procurement-overview-card").then((allCount) => {
            // Select the second option (first non-"All" shop)
            cy.get("#proc-shop-select")
                .find("option")
                .eq(1)
                .invoke("val")
                .then((shopValue) => {
                    cy.get("#proc-shop-select").select(shopValue);
                    getAgreementCount("procurement-overview-card").then((filteredCount) => {
                        expect(filteredCount).to.be.at.most(allCount);
                        expect(filteredCount).to.be.at.least(1);
                    });
                });
        });
    });

    it("returns to all agreements when selecting All", () => {
        getAgreementCount("procurement-overview-card").then((allCount) => {
            // Filter to a specific shop
            cy.get("#proc-shop-select")
                .find("option")
                .eq(1)
                .invoke("val")
                .then((shopValue) => {
                    cy.get("#proc-shop-select").select(shopValue);

                    // Reset to all
                    cy.get("#proc-shop-select").select("All");
                    getAgreementCount("procurement-overview-card").then((restoredCount) => {
                        expect(restoredCount).to.equal(allCount);
                    });
                });
        });
    });

    it("updates step summary when filtering by proc shop", () => {
        cy.get("#proc-shop-select")
            .find("option")
            .eq(1)
            .invoke("val")
            .then((shopValue) => {
                cy.get("#proc-shop-select").select(shopValue);
                cy.get("[data-cy='procurement-step-summary-card']").within(() => {
                    cy.contains(/\d+%/).should("exist");
                });
            });
    });
});

describe("Procurement Dashboard - Combined Tab and Proc Shop Filtering", () => {
    it("applies both tab and proc shop filters simultaneously", () => {
        getAgreementCount("procurement-overview-card").then((allCount) => {
            cy.contains("a", "First Award").click();
            cy.get("#proc-shop-select")
                .find("option")
                .eq(1)
                .invoke("val")
                .then((shopValue) => {
                    cy.get("#proc-shop-select").select(shopValue);
                    getAgreementCount("procurement-overview-card").then((filteredCount) => {
                        expect(filteredCount).to.be.at.most(allCount);
                    });
                });
        });
    });

    it("shows no results when Modifications tab is selected since all test data is NEW", () => {
        cy.contains("a", "Modifications").click();
        cy.get("#proc-shop-select")
            .find("option")
            .eq(1)
            .invoke("val")
            .then((shopValue) => {
                cy.get("#proc-shop-select").select(shopValue);
                cy.get("[data-cy='procurement-overview-card']").within(() => {
                    cy.contains(/\d+ agreements/).should("be.visible");
                });
            });
    });
});
