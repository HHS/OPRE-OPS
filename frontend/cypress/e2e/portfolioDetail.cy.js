/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/portfolios/1");
    cy.get("#fiscal-year-select").select("2023");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.visit("/portfolios/1");
    cy.get("h1").should("contain", "Child Welfare Research");
    cy.get("h2").should("contain", "Division of Child and Family Development");
    cy.get("dt").should("contain", "Team Leader");
    cy.get("dd").should("contain", "Chris Fortunato");
    cy.get("div.margin-top-1 > .text-base-dark").should("contain", "Portfolio Description");
    cy.get("p").should("contain", "The promotion of children’s safety, permanence, and well-being");
    cy.get("a").should("contain", "Budget and Funding");
    cy.get("a").should("contain", "Projects and Spending");
    cy.get("a").should("contain", "People and Teams");
    cy.get("h2").should("contain", "Portfolio Budget Summary");
    cy.get("h3").should("contain", "Budget");
    cy.get("h3").should("contain", "Budget Status");
    cy.get("option").should("contain", "2022");
    cy.get("option").should("contain", "2023");
    // add  two for  new  charts summary
    cy.get("#currency-summary-card").should("be.visible");
    cy.get("#portfolioBudgetStatusChart").should("be.visible");
    cy.get(".usa-select").should("be.visible");
    cy.get("span").should("contain", "$");
    cy.get("span").should("contain", "Carry-Forward");
});

it("loads the Portfolio Budget Details component", () => {
    cy.get("#fiscal-year-select").select("2021");
    cy.get("h2").should("contain", "Portfolio Budget Details by CAN");
    cy.get("section").should("contain", "G99IA14");
});

it("expands the description when one clicks read more", () => {
    cy.contains("read more").click();
    cy.get("a").should("contain", "See more on the website");
});

it("shows the Portfolio Projects and Spending tab", () => {
    cy.visit("/portfolios/1/research-projects/");
    cy.get("#fiscal-year-select").select("2023");
    // summary cards
    cy.get("h2").should("contain", "Projects & Spending Summary");
    cy.get("h3").should("contain", "FY 2023 Budget vs Spending");
    cy.get("h3").should("contain", "FY 2023 Projects");
    cy.get("h3").should("contain", "FY 2023 Agreements");
    // tables
    cy.get("h2").should("contain", "Research Projects");
    cy.get("h2").should("contain", "Administrative & Support Projects");
});
