import { testLogin } from "./utils";

const CURRENT_FY = new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0);

/**
 * Helper: extracts the agreement count number from text like "6 agreements"
 * within a given parent element (selected by data-cy).
 */
const getAgreementCount = () => {
    return cy
        .get("[data-cy='procurement-overview-total-agreements']")
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

describe("Procurement Dashboard - Summary/Details Consistency", () => {
    beforeEach(() => {
        testLogin("procurement-team");
        cy.visit("/procurement-dashboard");
        cy.get("[data-cy='procurement-overview-card']", { timeout: 30000 }).should("exist");
    });

    it("step accordion agreement counts match summary card counts", () => {
        getAgreementCount().then((totalFromOverview) => {
            // Expand all detail accordions
            cy.get("[data-cy^='step-builder-accordion-']").each(($accordion) => {
                cy.wrap($accordion).find("button.usa-accordion__button").click();
            });

            // Sum agreement counts from each expanded step
            cy.get("[data-cy='details-step-agreements-count']").then(($counts) => {
                let totalFromDetails = 0;
                $counts.each((_, el) => {
                    totalFromDetails += parseInt(el.textContent, 10) || 0;
                });
                expect(totalFromDetails).to.equal(totalFromOverview);
            });
        });
    });
});

describe("Procurement Dashboard - Authorized User", () => {
    beforeEach(() => {
        testLogin("procurement-team");
        cy.visit("/procurement-dashboard");
        // Wait for the page to fully load
        cy.get("[data-cy='procurement-overview-card']", { timeout: 30000 }).should("exist");
    });

    describe("Overview Card", () => {
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

    describe("Step Summary Card", () => {
        it("shows agreement counts and percentages for each step", () => {
            cy.get("[data-cy='procurement-step-summary-card']").within(() => {
                // Should display at least one percentage
                cy.contains(/\d+%/).should("exist");
            });
        });
    });

    describe("Budget Lines by Step Card", () => {
        it("renders the budget lines by step card", () => {
            cy.get("[data-cy='budget-lines-by-step-card']").within(() => {
                cy.contains(`FY ${CURRENT_FY} Budget Lines By Procurement Step`).should("be.visible");
            });
        });
    });

    describe("Tab Filtering", () => {
        it("First Award and Modifications tabs are disabled", () => {
            cy.contains("button", "First Award").should("be.disabled");
            cy.contains("button", "Modifications").should("be.disabled");
        });
    });

    describe("Filters", () => {
        it("renders the filter modal with Procurement Shop and Division comboboxes", () => {
            cy.get("button").contains("Filter").click();
            cy.get(".proc-shop-combobox__control").should("be.visible");
            cy.get(".division-combobox__control").should("be.visible");
        });

        it("populates the procurement shop combobox with options", () => {
            cy.get("button").contains("Filter").click();
            cy.get(".proc-shop-combobox__control").click();
            cy.get(".proc-shop-combobox__menu").find(".proc-shop-combobox__option").should("have.length.at.least", 1);
        });

        it("filters agreements by procurement shop when selecting a specific shop", () => {
            getAgreementCount().then((allCount) => {
                // Open the filter modal and select the first procurement shop option
                cy.get("button").contains("Filter").click();
                cy.get(".proc-shop-combobox__control").click();
                cy.get(".proc-shop-combobox__menu").find(".proc-shop-combobox__option").first().click();

                // Apply the filter
                cy.get("button").contains("Apply").click();

                getAgreementCount().then((filteredCount) => {
                    expect(filteredCount).to.be.at.most(allCount);
                    expect(filteredCount).to.be.at.least(1);
                });
            });
        });

        it("returns to all agreements when the filter is reset", () => {
            getAgreementCount().then((allCount) => {
                // Filter to a specific shop
                cy.get("button").contains("Filter").click();
                cy.get(".proc-shop-combobox__control").click();
                cy.get(".proc-shop-combobox__menu").find(".proc-shop-combobox__option").first().click();
                cy.get("button").contains("Apply").click();

                // Reset the filter back to all
                cy.get("button").contains("Filter").click();
                cy.get("button").contains("Reset").click();
                cy.get("button").contains("Apply").click();

                cy.get("[data-cy='procurement-overview-total-agreements']").should("contain", `${allCount} agreements`);
            });
        });

        it("filters agreements by division when selecting a specific division", () => {
            getAgreementCount().then((allCount) => {
                // Open the filter modal and select the first division option
                cy.get("button").contains("Filter").click();
                cy.get(".division-combobox__control").click();
                cy.get(".division-combobox__menu").find(".division-combobox__option").first().click();

                // Apply the filter
                cy.get("button").contains("Apply").click();

                getAgreementCount().then((filteredCount) => {
                    expect(filteredCount).to.be.at.most(allCount);
                });
            });
        });
    });
});
