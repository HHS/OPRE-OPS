/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";
import { getCurrentFiscalYear } from "../../src/helpers/utils.js";

beforeEach(() => {
    testLogin("budget-team");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

const can502Nickname = "SSRD";
const can502Description = "Social Science Research and Development";
const can504 = {
    number: 504,
    nickname: "G994426",
    budgetAmount: "5_000_000"
};

const currentFiscalYear = getCurrentFiscalYear();

describe("CAN detail page", () => {
    it("shows the CAN details page", () => {
        cy.visit("/cans/502/");
        cy.get("h1").should("contain", "G99PHS9"); // heading
        cy.get("p").should("contain", can502Nickname); // sub-heading
        cy.get("span").should("contain", "Nicole Deterding"); // team member
        cy.get("span").should("contain", "Director Derrek"); // division director
        cy.get("span").should("contain", "Program Support"); // portfolio
        cy.get("span").should("contain", "Division of Data and Improvement"); // division
    });
    it("CAN Edit form", () => {
        cy.visit("/cans/502/");
        cy.get("#fiscal-year-select").select("2024");
        cy.get("#edit").should("not.exist");
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").should("exist");
        cy.get("#edit").click();
        cy.get("h2").should("contain", "Edit CAN Details");
        cy.get("#can-nickName").invoke("val").should("equal", can502Nickname);
        cy.get("#can-nickName").clear();
        cy.get(".usa-error-message").should("exist").contains("This is required information");
        cy.get("#save-changes").should("be.disabled");
        cy.get("#can-nickName").type("Test Can Nickname");
        cy.get("#save-changes").should("not.be.disabled");
        cy.get(".usa-error-message").should("not.exist");
        cy.get("#description").invoke("val").should("equal", can502Description);
        cy.get("#description").clear();
        cy.get("#description").type("Test description.");
        cy.get("#save-changes").click();
        cy.get(".usa-alert__body").should("contain", "The CAN G99PHS9 has been successfully updated.");
        cy.get("p").should("contain", "Test Can Nickname");
        cy.get("dd").should("contain", "Test description.");
        // revert back to original values
        cy.get("#edit").click();
        cy.get("#can-nickName").clear();
        cy.get("#can-nickName").type(can502Nickname);
        cy.get("#description").clear();
        cy.get("#description").type(can502Description);
        cy.get("#save-changes").click();
    });
    it("handles cancelling from CAN edit form", () => {
        cy.visit("/cans/502/");
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        // Attempt cancel without making any changes
        cy.get("#edit").click();
        cy.get("[data-cy='cancel-button']").click();
        cy.get(".usa-modal__heading").should(
            "contain",
            "Are you sure you want to cancel editing? Your changes will not be saved."
        );
        cy.get("[data-cy='cancel-action']").click();
        // Exit out of the cancel modal
        cy.get("[data-cy='cancel-button']").click();
        // Actual cancel event
        cy.get("[data-cy='confirm-action']").click();
        cy.get("h2").should("contain", "CAN Details");
        cy.get("p").should("contain", can502Nickname);
        cy.get("dd").should("contain", can502Description);
    });
    it("shows the CAN Spending page", () => {
        cy.visit("/cans/504/spending");
        cy.get("#fiscal-year-select").select("2043");
        cy.get("h1").should("contain", "G994426"); // heading
        cy.get("p").should("contain", "HS"); // sub-heading
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
        cy.get("p").should("contain", "HS"); // sub-heading
        cy.get("[data-cy=can-funding-info-card]")
            .should("exist")
            .and("contain", "EEXXXX20215DAD")
            .and("contain", "5 Years")
            .and("contain", "IDDA")
            .and("contain", "09/30/25")
            .and("contain", "2021")
            .and("contain", "Quarterly")
            .and("contain", "Direct")
            .and("contain", "Discretionary");
        cy.get("[data-cy=budget-received-card]")
            .should("exist")
            .and("contain", "FY 2024 Funding Received YTD")
            .and("contain", "$ 6,000,000.00")
            .and("contain", "Received")
            .and("contain", "Received $6,000,000.00 of $10,000,000.00");
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
            .and("contain", "60%");
    });
    it("handles budget form", () => {
        cy.visit(`/cans/${can504.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("#carry-forward-card").should("contain", "$ 10,000,000.00");
        cy.get("#save-changes").should("be.disabled");
        cy.get("#add-fy-budget").should("be.disabled");
        cy.get("#carry-forward-card").should("contain", "0");
        cy.get("[data-cy='can-budget-fy-card']").should("contain", "0");
        cy.get("#budget-amount").type(can504.budgetAmount);
        cy.get("#budget-amount").clear();
        cy.get(".usa-error-message").should("exist").contains("This is required information");
        cy.get("#budget-amount").type(can504.budgetAmount);
        cy.get(".usa-error-message").should("not.exist");
        cy.get("#add-fy-budget").click();
        cy.get("[data-cy='can-budget-fy-card']").should("contain", "5,000,000.00");
        cy.get("#save-changes").should("be.enabled");
        cy.get("#save-changes").click();
        cy.get(".usa-alert__body").should("contain", `The CAN ${can504.nickname} has been successfully updated.`);
        cy.get("[data-cy=budget-received-card]").should("exist").and("contain", "Received $0.00 of $5,000,000.00");
        cy.get("[data-cy=can-budget-fy-card]")
            .should("exist")
            .and("contain", "CAN Budget by FY")
            .and("contain", `FY ${currentFiscalYear}`)
            .and("contain", "$5,000,000.00");
    });
    it("handles cancelling from budget form", () => {
        cy.visit(`/cans/${can504.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("#carry-forward-card").should("contain", "0");
        cy.get("[data-cy='can-budget-fy-card']").should("contain", "5,000,000.00");
        cy.get("#budget-amount").type("6_000_000");
        cy.get("#add-fy-budget").click();
        cy.get("[data-cy='can-budget-fy-card']").should("contain", "6,000,000.00");
        cy.get("#save-changes").should("be.enabled");
        cy.get("[data-cy=cancel-button]").should("be.enabled");
        cy.get("[data-cy=cancel-button]").click();
        cy.get(".usa-modal__heading").should(
            "contain",
            "Are you sure you want to cancel editing? Your changes will not be saved."
        );
        cy.get("[data-cy='confirm-action']").click();
        cy.get("[data-cy=budget-received-card]").should("exist").and("contain", "Received $0.00 of $5,000,000.00");
        cy.get("[data-cy=can-budget-fy-card]")
            .should("exist")
            .and("contain", "CAN Budget by FY")
            .and("contain", `FY ${currentFiscalYear}`)
            .and("contain", "$5,000,000.00");
    });
    it("handles not showing carry forward card", () => {
        cy.visit(`/cans/500/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("#carry-forward-card").should("not.exist");
    });
});
