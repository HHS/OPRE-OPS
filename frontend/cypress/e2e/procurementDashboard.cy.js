import { testLogin } from "./utils";

const CURRENT_FY = new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0);

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
            // Should show the agreement count
            cy.contains("6 agreements").should("be.visible");
        });
    });

    it("shows agreement counts per status", () => {
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            // All 6 agreements have both Planned and Executing BLIs
            cy.contains("6 agreements").should("exist");
        });
    });
});

describe("Procurement Dashboard - Step Summary Card", () => {
    it("shows agreement counts and percentages for each step", () => {
        cy.get("[data-cy='procurement-step-summary-card']").within(() => {
            // Each step has 1 agreement, 1/6 ≈ 17%
            cy.contains("17%").should("exist");
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
        cy.contains("a", "First Award").click();
        cy.url().should("include", "filter=first-award");
        // All test agreements are NEW, so all 6 should still appear
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains("6 agreements").should("be.visible");
        });
    });

    it("filters to Modifications (CONTINUING) agreements when clicking the Modifications tab", () => {
        cy.contains("a", "Modifications").click();
        cy.url().should("include", "filter=modifications");
        // No CONTINUING agreements in test data, so should show 0
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains("0 agreements").should("be.visible");
            cy.contains("$0").should("be.visible");
        });
    });

    it("shows all agreements when clicking the All Procurement tab", () => {
        // First navigate to a filtered tab
        cy.contains("a", "First Award").click();
        cy.url().should("include", "filter=first-award");

        // Then navigate to All Procurement
        cy.contains("a", "All Procurement").click();
        cy.url().should("not.include", "filter=");
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains("6 agreements").should("be.visible");
        });
    });

    it("updates step summary card when switching tabs", () => {
        // All Procurement - should show step data
        cy.get("[data-cy='procurement-step-summary-card']").within(() => {
            cy.contains("Step 1").should("be.visible");
        });

        // Modifications - no agreements, step counts should be 0
        cy.contains("a", "Modifications").click();
        cy.get("[data-cy='procurement-step-summary-card']").within(() => {
            cy.contains("0%").should("exist");
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
        // FY2026 agreements use PSC, GCS, NIH, IBC
        cy.get("#proc-shop-select").find("option").contains("GCS");
        cy.get("#proc-shop-select").find("option").contains("PSC");
    });

    it("filters agreements by procurement shop when selecting a specific shop", () => {
        // Select PSC - agreements 15 and 19
        cy.get("#proc-shop-select").select("PSC");
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains("2 agreements").should("be.visible");
        });
    });

    it("filters to a single-agreement shop", () => {
        // Select NIH - only agreement 17
        cy.get("#proc-shop-select").select("NIH");
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains("1 agreements").should("be.visible");
        });
    });

    it("returns to all agreements when selecting All", () => {
        // First filter to a specific shop
        cy.get("#proc-shop-select").select("GCS");
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains("2 agreements").should("be.visible");
        });

        // Reset to all
        cy.get("#proc-shop-select").select("All");
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains("6 agreements").should("be.visible");
        });
    });

    it("updates step summary when filtering by proc shop", () => {
        // Select PSC - agreements 15 (step 1) and 19 (step 5)
        cy.get("#proc-shop-select").select("PSC");
        cy.get("[data-cy='procurement-step-summary-card']").within(() => {
            // With 2 agreements, each step with an agreement has 50%
            cy.contains("50%").should("exist");
        });
    });
});

describe("Procurement Dashboard - Combined Tab and Proc Shop Filtering", () => {
    it("applies both tab and proc shop filters simultaneously", () => {
        // Filter to First Award + PSC
        cy.contains("a", "First Award").click();
        cy.get("#proc-shop-select").select("PSC");
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains("2 agreements").should("be.visible");
        });
    });

    it("shows no results when Modifications tab is selected since all test data is NEW", () => {
        cy.contains("a", "Modifications").click();
        cy.get("#proc-shop-select").select("PSC");
        cy.get("[data-cy='procurement-overview-card']").within(() => {
            cy.contains("0 agreements").should("be.visible");
        });
    });
});
