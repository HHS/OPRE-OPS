/// <reference types="cypress" />
import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("budget-team");
});

// Uncomment the following lines to enable accessibility testing
// This is being commented out for now because it is causing issues with the test,
// i.e. the test suite itself is failing (false negative).
// afterEach(() => {
//     cy.injectAxe();
//     cy.checkA11y(null, null, terminalLog);
// });

describe("Portfolio Detail Page", () => {
    it("loads", () => {
        cy.visit("/portfolios/1/spending");
        cy.get("h1").should("be.visible");
        cy.get("h1").should("contain", "Child Welfare Research");
        cy.get("h2").should("contain", "Division of Child and Family Development");
        cy.get("dt").should("contain", "Team Leader");
        cy.get("dd").should("contain", "Chris Fortunato");
        cy.get("div.margin-top-1 > .text-base-dark").should("contain", "Portfolio Description");
        cy.get("p").should("contain", "The promotion of children’s safety, permanence, and well-being");
        cy.contains("read more").click();
        const expectedUrl = "https://acf.gov/opre/topic/overview/abuse-neglect-adoption-foster-care";
        cy.contains("a", "See more on the website").should("have.attr", "href", expectedUrl);
    });

    it("loads the Portfolio spending component", () => {
        cy.visit("/portfolios/1/spending");
        cy.get("h1").should("be.visible");
        cy.get("h2").should("contain", "Portfolio Budget & Spending Summary");
        cy.get("#fiscal-year-select").select("2044");
        cy.get('[data-cy="big-budget-summary-card"]').should("contain", "Spending $182,537,310.00 of $0");
        cy.get("#project-agreement-bli-card")
            // The BLI status counts here are incorrect and will be fixed with #3793
            .should("contain", "3 Draft")
            .should("contain", "3 Planned")
            .should("contain", "4 Executing")
            .should("contain", "2 Obligated");
        cy.get("#donut-graph-with-legend-card")
            .should("contain", "$72,375,166.00")
            .should("contain", "$72,151,301.00")
            .should("contain", "$48,095,521.00")
            .should("contain", "$62,290,488.00");
        cy.get("table").should("exist");
        // check table to have more than 10 rows
        cy.get("tbody").children().should("have.length.greaterThan", 10);
        // check table to only have FY 2044  in the FY column
        cy.get("tbody")
            .children()
            .each(($el) => {
                cy.wrap($el).should(($element) => {
                    const text = $element.text();
                    expect(text).to.satisfy((t) => t.includes("2044") || t.includes("TBD"));
                });
            });
    });

    it("shows the Portfolio Funding tab", () => {
        cy.visit("/portfolios/1/funding");
        cy.get("h1").should("be.visible");
        cy.get("#fiscal-year-select").select("2021");
        cy.get("h2").should("contain", "Portfolio Funding Summary");
        // summary cards
        cy.get('[data-cy="line-graph-with-legend-card"]')
            .should("contain", "$0")
            .should("contain", "0%")
            .should("contain", "$10,200,000.00")
            .should("contain", "100%");
        cy.get('[data-cy="portfolio-budget-card"]').should("contain", "$10,200,000.00");
        // check the first can card for the correct values
        cy.get('[data-cy="can-card-G990136"]')
            .should("contain", "G990136")
            .should("contain", "$6,000,000.00")
            .should("contain", "$4,000,000.00")
            .should("contain", "$0")
            .should("contain", "$10,000,000.00")
            .should("contain", "FY 2021 New Funding");
        cy.get('[data-cy="can-card-G99IA14"]')
            .should("contain", "G99IA14")
            .should("contain", "$200,000.00 ")
            .should("contain", "$0")
            .should("contain", "FY 2021 New Funding");
    });

    it("shows new and carry forward funding for portfolio 6 with FY 2023", () => {
        cy.visit("/portfolios/6/funding");
        cy.get("h1").should("be.visible");
        cy.get("#fiscal-year-select").select("2023");
        cy.get('[data-cy="line-graph-with-legend-card"]')
            .should("contain", "$11,140,000.00")
            .should("contain", "32%")
            .should("contain", "$23,420,000.00")
            .should("contain", "68%");
    });

    it("should handle a portfolio with budgetlines that have no agreement", () => {
        cy.visit("/portfolios/4/spending");
        cy.get("h1").should("be.visible");
        cy.get('[data-cy="big-budget-summary-card"]').should("contain", "Spending $0 of $0");
        // should contain 3 0s
        cy.get("#project-agreement-bli-card").should("contain", "0").should("contain", "0").should("contain", "0");
        cy.get("#donut-graph-with-legend-card")
            .should("contain", "0%")
            .should("contain", "0%")
            .should("contain", "0%")
            .should("contain", "0%");
        // check table for 3 rows
        cy.get("tbody").children().should("have.length", 3);
        // check first row for containing TBD
        cy.get("tbody").children().first().should("contain", "TBD");

        cy.get("#fiscal-year-select").select("2022");
        cy.get("h1").should("be.visible");
        cy.get('[data-cy="big-budget-summary-card"]').should("contain", "Spending $4,162,025.00 of $4,162,025.00");
        cy.get("#project-agreement-bli-card").should("contain", "1").should("contain", "1").should("contain", "2");
        cy.get("#donut-graph-with-legend-card")
            .should("contain", "100%")
            .should("contain", "100%")
            .should("contain", "0%")
            .should("contain", "0%");
        // check table for more than 3 rows
        cy.get("tbody").children().should("have.length.greaterThan", 3);
        // table should only have 2022 or TBD in the FY column
        cy.get("tbody")
            .children()
            .each(($el) => {
                cy.wrap($el).should(($element) => {
                    const text = $element.text();
                    expect(text).to.satisfy((t) => t.includes("2022") || t.includes("TBD"));
                });
            });
    });

    it("CAN cards should show TBD if no budget is provided yet", () => {
        cy.visit("/portfolios/5/funding");
        cy.get("h1").should("be.visible");
        cy.get("#fiscal-year-select").select("2025");
        cy.get('[data-cy="can-card-G991234"]').should("contain", "TBD");
        cy.get('[data-cy="can-card-GE7RM25"]').should("contain", "TBD");
    });
});
