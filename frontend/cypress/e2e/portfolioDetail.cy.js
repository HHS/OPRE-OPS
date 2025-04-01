/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("budget-team");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Portfolio Detail Page", () => {
    it("loads", () => {
        cy.visit("/portfolios/1/spending").wait(1000);
        cy.get("#fiscal-year-select").select("2021");
        cy.get("h1").should("contain", "Child Welfare Research");
        cy.get("h2").should("contain", "Division of Child and Family Development");
        cy.get("dt").should("contain", "Team Leader");
        cy.get("dd").should("contain", "Chris Fortunato");
        cy.get("div.margin-top-1 > .text-base-dark").should("contain", "Portfolio Description");
        cy.get("p").should("contain", "The promotion of children’s safety, permanence, and well-being");
        cy.contains("read more").click();
        cy.get("a").should("contain", "See more on the website");
    });

    it("loads the Portfolio spending component", () => {
        cy.visit("/portfolios/1/spending").wait(1000);
        cy.get("#fiscal-year-select").select("2044");
        cy.get("h2").should("contain", "Portfolio Budget & Spending Summary");
        cy.get('[data-cy="big-budget-summary-card"]').should("contain", "Spending $182,537,310 of $0");
        cy.get("#project-agreement-bli-card")
            .should("contain", "1 Direct Obligation")
            .should("contain", "7 Planned")
            .should("contain", "5 Executing")
            .should("contain", "10 Obligated");
        cy.get("#donut-graph-with-legend-card")
            .should("contain", "$72,375,166.00")
            .should("contain", "$72,151,301.00")
            .should("contain", "$48,095,521.00")
            .should("contain", "$62,290,488.00");
        //3 table rows trs elements
        // table should exist and have one row
        cy.get("table").should("exist");
        cy.get("tbody").children().should("have.length", 3);
    });

    it("shows the Portfolio Funding tab", () => {
        cy.visit("/portfolios/1/funding").wait(1000);
        cy.get("#fiscal-year-select").select("2021");
        cy.get("h2").should("contain", "Portfolio Funding Summary");
        // summary cards
        cy.wait(1000);
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
        cy.visit("/portfolios/6/funding").wait(1000);
        cy.get("#fiscal-year-select").select("2023");
        cy.wait(1000);
        cy.get('[data-cy="line-graph-with-legend-card"]')
            .should("contain", "$11,140,000.00")
            .should("contain", "32%")
            .should("contain", "$23,420,000.00")
            .should("contain", "68%");
    });
});
