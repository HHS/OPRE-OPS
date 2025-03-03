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
    budgetAmount: "5_000_000.55",
    updatedBudgetAmount: "8_000_000.88"
};

const currentFiscalYear = getCurrentFiscalYear();

describe("CAN detail page", () => {
    it("shows the CAN details page", () => {
        cy.visit("/cans/502/");
        cy.get("h1").should("contain", "G99PHS9"); // heading
        cy.get("p").should("contain", can502Nickname); // sub-heading
        cy.get("span").should("contain", "Sheila Celentano"); // team member
        cy.get("span").should("contain", "Director Derrek"); // division director
        cy.get("span").should("contain", "Data Governance"); // portfolio
        cy.get("span").should("contain", "Division of Data Governance"); // division
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

        // check can history for UPDATING the nickname and description
        cy.visit(`/cans/502`);
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]').each(
            ($el, index) => {
                const expectedTitles = ["Nickname Edited", "Description Edited"];
                cy.wrap($el).should("exist").contains(expectedTitles[index]);
            }
        );
        const expectedMessages = [
            "Budget Team edited the nickname from Test Can Nickname to SSRD", // due to revert back to original values
            "Budget Team edited the description", // due to revert back to original values
            "Budget Team edited the nickname from SSRD to Test Can Nickname",
            "Budget Team edited the description",
            "FY 2025 CAN Funding Information imported from CANBACs"
        ];
        cy.get('[data-cy="log-item-message"]').each((logItem, index) => {
            cy.wrap(logItem).should("exist").contains(expectedMessages[index]);
        });
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
    it("handles history", () => {
        cy.visit("/cans/500/");
        checkCANHistory();

        // test history logs for varying fiscal years
        cy.visit("/cans/501/");
        // select FY 2023 and confirm no history logs
        cy.get("#fiscal-year-select").select("2023");
        cy.get('[data-cy="can-history-container"]').should("not.exist");
        cy.get('[data-cy="can-history-list"]').should("not.exist");
        cy.get('[data-cy="history"]').should("contain", "No History");
        // switch to select FY 2024 and confirm 1 history log
        cy.get("#fiscal-year-select").select("2024");
        cy.get('[data-cy="can-history-container"]').should("exist");
        cy.get('[data-cy="history"]').should("exist");
        cy.get('[data-cy="can-history-list"]').should("exist");
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]').should(
            "contain",
            "Nickname Edited"
        );
        // switch to select FY 2025 and confirm 2 history logs
        cy.get("#fiscal-year-select").select("2025");
        cy.get('[data-cy="can-history-container"]').should("exist");
        cy.get('[data-cy="history"]').should("exist");
        cy.get('[data-cy="can-history-list"]').should("exist");
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]').should(
            "contain",
            "Nickname Edited"
        );
        cy.get('[data-cy="can-history-list"] > :nth-child(2) > .flex-justify > [data-cy="log-item-title"]').should(
            "contain",
            "FY 2025 Data Import"
        );
    });
});

describe("CAN spending page", () => {
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
});

describe("CAN funding page", () => {
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
        cy.get("#edit").click();
        // Check welcome modal
        cy.get("#ops-modal-heading").contains(
            "Data from the previous fiscal year can no longer be edited, but can be viewed by changing the FY dropdown on the CAN details page."
        );
        cy.get("[data-cy=confirm-action]").click();
        cy.get("#carry-forward-card").should("contain", "$ 10,000,000.00");
        cy.get("#save-changes").should("be.disabled");
        cy.get("#carry-forward-card").should("contain", "0");
        cy.get("[data-cy='can-budget-fy-card']").should("contain", "0");
        cy.get("#budget-amount").type(can504.budgetAmount);
        cy.get("#budget-amount").clear();
        cy.get("#budget-amount").type(can504.budgetAmount);
        cy.get(".usa-error-message").should("not.exist");
        cy.get("#add-fy-budget").click();
        cy.get("[data-cy='can-budget-fy-card']").should("contain", "$ 5,000,000.55");
        cy.get("#save-changes").should("be.enabled");
        cy.get("#save-changes").click();
        cy.get(".usa-alert__body").should("contain", `The CAN ${can504.nickname} has been successfully updated.`);
        cy.get("[data-cy=budget-received-card]").should("exist").and("contain", "Received $0.00 of $5,000,000.55");
        cy.get("[data-cy=can-budget-fy-card]")
            .should("exist")
            .and("contain", "CAN Budget by FY")
            .and("contain", `FY ${currentFiscalYear}`)
            .and("contain", "$5,000,000.55");
        // check can history for ADDING a budget
        cy.visit(`/cans/${can504.number}`);
        cy.get('[data-cy="can-history-list"]').should("exist");
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]')
            .should("exist")
            .contains(/FY 2025 Budget Entered/);
        const expectedMessages = [
            "Budget Team entered a FY 2025 budget of $5,000,000.55",
            "FY 2025 CAN Funding Information imported from CANBACs"
        ];
        cy.get('[data-cy="log-item-message"]').each((logItem, index) => {
            cy.wrap(logItem).should("exist").contains(expectedMessages[index]);
        });
    });
    it("shows history message when updating a budget", () => {
        // update the budget amount
        cy.visit(`/cans/${can504.number}/funding`);
        cy.get("#edit").click();
        cy.get("#budget-amount").clear();
        cy.get("#budget-amount").type(can504.updatedBudgetAmount);
        cy.get("#add-fy-budget").click();
        cy.get("#save-changes").click();

        // check can history for UPDATING a budget
        cy.visit(`/cans/${can504.number}`);
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]')
            .should("exist")
            .contains(/FY 2025 Budget Edited/);
        const expectedMessages = [
            "Budget Team edited the FY 2025 budget from $5,000,000.55 to $8,000,000.88",
            "Budget Team entered a FY 2025 budget of $5,000,000.55",
            "FY 2025 CAN Funding Information imported from CANBACs"
        ];
        cy.get('[data-cy="log-item-message"]').each((logItem, index) => {
            cy.wrap(logItem).should("exist").contains(expectedMessages[index]);
        });
    });
    it("handle funding received form", () => {
        cy.visit(`/cans/${can504.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        // welcome modal should not be present
        cy.get("#ops-modal-heading").should("not.exist");
        // check that all buttons (saved, all funding received) are disabled
        cy.get("[data-cy=add-funding-received-btn]").should("be.disabled");
        cy.get("[data-cy=save-btn]").should("be.disabled");
        // enter amount into input
        cy.get("#funding-received-amount").type("1_000_000");
        cy.get("#funding-received-amount").blur();
        cy.get("[data-cy=add-funding-received-btn]").should("be.enabled");
        // clear and check validation
        cy.get("#funding-received-amount").clear();
        cy.get("[data-cy=add-funding-received-btn]").should("be.disabled");
        // Test received amount over budget amount
        cy.get("#funding-received-amount").type("9_000_000"); // amount is over the budget
        cy.get("[data-cy=add-funding-received-btn]").should("be.disabled");
        cy.get(".usa-error-message").should("exist").contains("Amount cannot exceed FY Budget");
        cy.get("#funding-received-amount").clear();
        cy.get("#funding-received-amount").type("1_000_000");
        cy.get("#funding-received-amount").blur();
        cy.get("[data-cy=add-funding-received-btn]").should("be.enabled");
        // enter and click on add funding received
        cy.get("#notes").type("Test notes");
        cy.get("[data-cy=add-funding-received-btn]").click();
        // check card on the right
        cy.get("[data-cy=budget-received-card]").should("exist").and("contain", "1,000,000.00");
        // edit a funding from table interaction
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').should("exist");
        cy.get("tbody").find("tr").first().find('[data-cy="delete-row"]').should("exist");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').click();
        // verify form is populated correctly
        cy.get("#funding-received-amount").invoke("val").should("equal", "1,000,000");
        cy.get("#notes").invoke("val").should("equal", "Test notes");
        // edit funding received form
        cy.get("#funding-received-amount").clear();
        cy.get("#funding-received-amount").type("2_000_000");
        cy.get("[data-cy=add-funding-received-btn]").click();
        cy.get("[data-cy=budget-received-card]").should("exist").and("contain", "2,000,000.00");
        // validation check to ensure amount does not exceed budget amount
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').click();
        cy.get("#funding-received-amount").clear();
        cy.get("#funding-received-amount").type("8_000_001"); // amount is over the budget
        cy.get("[data-cy=add-funding-received-btn]").should("be.disabled");
        cy.get(".usa-error-message").should("exist").contains("Amount cannot exceed FY Budget");
        cy.get("[data-cy=cancel-funding-received-btn]").click();
        // delete a funding received from table
        cy.get("#funding-received-amount").type("3_000_000");
        cy.get("#notes").type("Delete me please");
        cy.get("[data-cy=add-funding-received-btn]").click();
        cy.get("tbody").find("tr").eq(1).trigger("mouseover");
        cy.get("tbody").find("tr").eq(1).find('[data-cy="delete-row"]').click();
        cy.get("tbody").children().should("have.length", 1);
        // make sure the funding received card on the right updates
        cy.get("[data-cy=budget-received-card]").should("exist").and("contain", "2,000,000.00");
        // click on save button at bottom of form
        cy.get("[data-cy=save-btn]").click();
        // check success alert
        cy.get(".usa-alert__body").should("contain", `The CAN ${can504.nickname} has been successfully updated.`);
        // check that table and card are updated
        cy.get("[data-cy=budget-received-card]")
            .should("exist")
            .and("contain", "Received $2,000,000.00 of $8,000,000.88");
        cy.get("tbody").children().should("contain", "2025").and("contain", "$2,000,000.00").and("contain", "25%");

        // check can history for ADDING a funding received event
        cy.visit(`/cans/${can504.number}`);
        cy.get('[data-cy="can-history-list"]').should("exist");
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]')
            .should("exist")
            .contains(/Funding Received Added/);
        const expectedMessages = [
            "Budget Team added funding received to funding ID 526 in the amount of $2,000,000.00",
            "Budget Team edited the FY 2025 budget from $5,000,000.55 to $8,000,000.88",
            "Budget Team entered a FY 2025 budget of $5,000,000.55",
            "FY 2025 CAN Funding Information imported from CANBACs"
        ];
        cy.get('[data-cy="log-item-message"]').each((logItem, index) => {
            cy.wrap(logItem).should("exist").contains(expectedMessages[index]);
        });
    });
    it("shows correct total funding received when switching between fiscal years", () => {
        // have to visit the cans page first to set the fiscal year and recreate the bug
        cy.visit(`/cans`);
        cy.get("#fiscal-year-select").select("2023");
        cy.visit(`/cans/510/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("[data-cy=confirm-action]").click();
        // budget-received-card should show $ 0
        cy.get("[data-cy=budget-received-card]").should("contain", "$ 0");
    });
    it("handle posting, patching, and deleting funding received", () => {
        // create a new funding received -- POST
        cy.visit(`/cans/${can504.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("#funding-received-amount").type("1_000_000");
        cy.get("#notes").type("I should post");
        cy.get("[data-cy=add-funding-received-btn]").click();
        // edit note on the existing funding received -- PATCH
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').click();
        cy.get("#notes").clear();
        cy.get("#notes").type("I should patch");
        cy.get("[data-cy=add-funding-received-btn]").click();
        // save the changes
        cy.get("[data-cy=save-btn]").click();
        cy.wait(500);
        // go back to editing mode and delete a funding received -- DELETE
        cy.get("#edit").click();
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="delete-row"]').click();
        cy.get("tbody").children().should("have.length", 1);
        // save the changes
        cy.get("[data-cy=save-btn]").click();

        // check can history for DELETING a funding received event
        cy.visit(`/cans/${can504.number}`);
        cy.get('[data-cy="can-history-list"]').should("exist");
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]')
            .should("exist")
            .contains(/Funding Received Deleted/);
        const expectedMessages = [
            "Budget Team deleted funding received for funding ID 527 in the amount of $1,000,000.00",
            "Budget Team added funding received to funding ID 527 in the amount of $1,000,000.00",
            "Budget Team added funding received to funding ID 526 in the amount of $2,000,000.00",
            "Budget Team edited the FY 2025 budget from $5,000,000.55 to $8,000,000.88",
            "Budget Team entered a FY 2025 budget of $5,000,000.55",
            "FY 2025 CAN Funding Information imported from CANBACs"
        ];
        cy.get('[data-cy="log-item-message"]').each((logItem, index) => {
            cy.wrap(logItem).should("exist").contains(expectedMessages[index]);
        });
    });
    it("shows history message when updating a funding received", () => {
        cy.visit(`/cans/${can504.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').click();
        cy.get("#funding-received-amount").clear();
        cy.get("#funding-received-amount").type("3_500_000");
        cy.get("[data-cy=add-funding-received-btn]").click();
        cy.get("[data-cy=save-btn]").click();

        // check can history for UPDATING a funding received event
        cy.visit(`/cans/${can504.number}`);
        cy.get('[data-cy="can-history-list"]').should("exist");
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]')
            .should("exist")
            .contains(/Funding Received Edited/);
        const expectedMessages = [
            "Budget Team edited funding received for funding ID 526 from $2,000,000.00 to $3,500,000.00",
            "Budget Team deleted funding received for funding ID 527 in the amount of $1,000,000.00",
            "Budget Team added funding received to funding ID 527 in the amount of $1,000,000.00",
            "Budget Team added funding received to funding ID 526 in the amount of $2,000,000.00",
            "Budget Team edited the FY 2025 budget from $5,000,000.55 to $8,000,000.88",
            "Budget Team entered a FY 2025 budget of $5,000,000.55",
            "FY 2025 CAN Funding Information imported from CANBACs"
        ];
        cy.get('[data-cy="log-item-message"]').each((logItem, index) => {
            cy.wrap(logItem).should("exist").contains(expectedMessages[index]);
        });
    });
    it("handles cancelling from budget form", () => {
        cy.visit(`/cans/${can504.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("#carry-forward-card").should("contain", "$ 10,000,000.00");
        cy.get("[data-cy='can-budget-fy-card']").should("contain", "8,000,000.88");
        cy.get("#budget-amount").clear();
        cy.get("#budget-amount").type("6_000_000.66");
        cy.get("#add-fy-budget").click();
        cy.get("[data-cy='can-budget-fy-card']").should("contain", "6,000,000.66");
        cy.get("#save-changes").should("be.enabled");
        // test funding received form
        cy.get("#funding-received-amount").type("1_000_000");
        cy.get("[data-cy=add-funding-received-btn]").click();
        // edit from table
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').click();
        // cancel the edit and check save button status
        cy.get("[data-cy=cancel-funding-received-btn]").click();
        cy.get("#save-changes").should("be.enabled");
        // cancel changes
        cy.get("[data-cy=cancel-button]").should("be.enabled");
        cy.get("[data-cy=cancel-button]").click();
        cy.get(".usa-modal__heading").should(
            "contain",
            "Are you sure you want to cancel editing? Your changes will not be saved."
        );
        cy.get("[data-cy='confirm-action']").click();
        cy.get("[data-cy=budget-received-card]")
            .should("exist")
            .and("contain", "Received $3,500,000.00 of $8,000,000.88");
        cy.get("[data-cy=can-budget-fy-card]")
            .should("exist")
            .and("contain", "CAN Budget by FY")
            .and("contain", `FY ${currentFiscalYear}`)
            .and("contain", "$8,000,000.88");
        // check table has one row
        cy.get("tbody").children().should("have.length", 1);
    });
    it("handles not showing carry forward card", () => {
        cy.visit(`/cans/500/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("[data-cy=confirm-action]").click();
        cy.get("#carry-forward-card").should("not.exist");
    });
});

const checkCANHistory = () => {
    cy.get("h3").should("have.text", "History");
    cy.get('[data-cy="can-history-container"]').should("exist");
    cy.get('[data-cy="can-history-container"]').scrollIntoView();
    cy.get('[data-cy="can-history-list"]').should("exist");
    cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]').should("exist");
};
