/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("CAN detail page", () => {
    it("shows relevant CAN data", () => {
        cy.visit("/cans/502/");
        cy.get("h1").should("contain", "G99PHS9"); // heading
        cy.get("p").should("contain", "SSRD - 5 Years"); // sub-heading
        cy.get("span").should("contain", "Nicole Deterding"); // team member
        cy.get("span").should("contain", "Director Derrek"); // division director
        cy.get("span").should("contain", "Program Support"); // portfolio
    });
    it("shows the CAN Spending page", () => {
        cy.visit("/cans/504/spending");
        cy.get("#fiscal-year-select").select("2043");
        cy.get("h1").should("contain", "G994426"); // heading
        cy.get("p").should("contain", "HS - 5 Years"); // sub-heading
        // should contain the budget line table
        cy.get("table").should("exist");
        // table should have more than 1 row
        cy.get("tbody").children().should("have.length.greaterThan", 1);
        cy.get("#big-budget-summary-card").should("exist");
        cy.get("#big-budget-summary-card").should("contain", "-$ 3,000,000.00");
        cy.get("#project-agreement-bli-card").should("exist");
        cy.get("span").should("contain", "3 Draft");
        cy.get("span").should("contain", "1 Executing");
        cy.get("span").should("contain", "1 Planned");
        cy.get("#donut-graph-with-legend-card").should("exist");
        // switch to a different fiscal year
        cy.get("#fiscal-year-select").select("2022");
        // table should not exist
        cy.get("tbody").should("not.exist");
        cy.get("p").should("contain", "No budget lines have been added to this CAN.");
    });
    it("pagination on the bli table works as expected", () => {
        cy.visit("/cans/504/spending");
        cy.get("#fiscal-year-select").select("2043");
        cy.wait(1000);
        cy.get("ul").should("have.class", "usa-pagination__list");
        cy.get("li").should("have.class", "usa-pagination__item").contains("1");
        cy.get("button").should("have.class", "usa-current").contains("1");
        cy.get("li").should("have.class", "usa-pagination__item").contains("2");
        cy.get("li").should("have.class", "usa-pagination__item").contains("Next");
        cy.get("tbody").find("tr").should("have.length", 3);
        cy.get("li")
            .should("have.class", "usa-pagination__item")
            .contains("Previous")
            .find("svg")
            .should("have.attr", "aria-hidden", "true");

        // go to the second page
        cy.get("li").should("have.class", "usa-pagination__item").contains("2").click();
        cy.get("button").should("have.class", "usa-current").contains("2");
        cy.get("li").should("have.class", "usa-pagination__item").contains("Previous");
        cy.get("li")
            .should("have.class", "usa-pagination__item")
            .contains("Next")
            .find("svg")
            .should("have.attr", "aria-hidden", "true");

        // go back to the first page
        cy.get("li").should("have.class", "usa-pagination__item").contains("1").click();
        cy.get("button").should("have.class", "usa-current").contains("1");
    });
    it("shows the CAN Funding page", () => {
        cy.visit("/cans/504/funding");
        cy.get("#fiscal-year-select").select("2024");
        cy.get("h1").should("contain", "G994426"); // heading
        cy.get("p").should("contain", "HS - 5 Years"); // sub-heading
        cy.get("[data-cy=can-funding-info-card]")
            .should("exist")
            .and("contain", "EEXXXX20215DAD")
            .and("contain", "5 Years")
            .and("contain", "IDDA")
            .and("contain", "09/30/25")
            .and("contain", "2021");
        cy.get("[data-cy=budget-summary-card]")
            .should("exist")
            .and("contain", "FY 2024 Funding Received YTD")
            .and("contain", "$ 4,000,000.00")
            .and("contain", "Received")
            .and("contain", "Received $4,000,000.00 of $6,000,000.00");
        cy.get("[data-cy=can-budget-fy-card]")
            .should("exist")
            .and("contain", "CAN Budget by FY")
            .and("contain", "FY 2024")
            .and("contain", "FY 2023")
            .and("contain", "FY 2022")
            .and("contain", "FY 2021")
            .and("contain", "$10,000,000.00");
        // table should exist and have one row
        cy.get("table").should("exist");
        cy.get("tbody").children().should("have.length", 1);
        // table should contain 509, 2024, $6,000,000.00, 100%
        cy.get("tbody")
            .children()
            .should("contain", "509")
            .and("contain", "2024")
            .and("contain", "$6,000,000.00")
            .and("contain", "100%");
    });
});
