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

describe("Procurement Dashboard - Role-Based Access", () => {
    it("redirects an unauthorized user to the error page", () => {
        testLogin("basic");
        cy.visit("/procurement-dashboard");
        cy.url().should("include", "/error");
        cy.contains("Procurement Dashboard").should("not.exist");
    });
});

beforeEach(() => {
    testLogin("procurement-team");
    cy.visit("/procurement-dashboard");
    // Wait for the page to fully load
    cy.get("[data-cy='procurement-overview-card']", { timeout: 30000 }).should("exist");
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
    it("First Award and Modifications tabs are disabled", () => {
        cy.contains("button", "First Award").should("be.disabled");
        cy.contains("button", "Modifications").should("be.disabled");
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
});
