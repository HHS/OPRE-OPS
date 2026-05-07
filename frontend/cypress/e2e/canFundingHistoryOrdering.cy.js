/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";
import { getCurrentFiscalYear } from "../../src/helpers/utils.js";

// Regression test for issue #5571: the CAN history panel must display history
// events in the order the user actually took them in the UI. When a budget-team
// user enters an FY Budget and then adds Funding Received, the newest-first list
// must show "Funding Received Added" on top and "FY Budget Entered/Edited" below
// it. Before this fix, the two requests raced on the client and the backend
// recorded them in non-deterministic order.

beforeEach(() => {
    testLogin("budget-team");
    cy.intercept("POST", "**/api/v1/can-funding-budgets/**").as("canFundingBudgetPost");
    cy.intercept("PATCH", "**/api/v1/can-funding-budgets/**").as("canFundingBudgetPatch");
    cy.intercept("POST", "**/api/v1/can-funding-received/**").as("canFundingReceived");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

const can = {
    number: 527,
    nickname: "G995679"
};

const currentFiscalYear = getCurrentFiscalYear();

const closeWelcomeModalIfPresent = (attempts = 10) => {
    cy.get("body").then(($body) => {
        if ($body.find("#ops-modal-heading").length > 0) {
            cy.get("[data-cy=confirm-action]").click();
            cy.get("#ops-modal-heading").should("not.exist");
            cy.get(".usa-modal-wrapper").should("not.exist");
            return;
        }

        if (attempts > 0) {
            cy.wait(300);
            closeWelcomeModalIfPresent(attempts - 1);
        }
    });
};

const setMoneyInputValue = (selector, value) => {
    cy.get(selector)
        .should("be.visible")
        .and("not.be.disabled")
        .click()
        .type("{selectall}{backspace}")
        .type(`${value}`)
        .blur();
};

describe("CAN funding history ordering (issue #5571)", () => {
    it("records budget before funding received when both are saved together", () => {
        // Pick amounts that are guaranteed not to exceed the (growing) budget.
        // Budget = $9,000,000 is large enough to accommodate any prior received totals
        // plus the $1,000 we're adding below. The ratio is kept modest so the
        // "Amount cannot exceed FY Budget" validator stays green.
        const budgetAmount = "9000000";
        const receivedAmount = "1000";

        cy.visit(`/cans/${can.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit", { timeout: 20000 }).should("be.visible").and("not.be.disabled").click();
        closeWelcomeModalIfPresent();

        // Step 1: user enters FY Budget FIRST.
        cy.get("#budget-amount", { timeout: 20000 }).should("be.visible").and("not.be.disabled");
        setMoneyInputValue("#budget-amount", budgetAmount);
        cy.get("#add-fy-budget").should("be.enabled").click();

        // Step 2: user enters Funding Received SECOND.
        cy.get("#funding-received-amount").should("be.visible").and("not.be.disabled");
        setMoneyInputValue("#funding-received-amount", receivedAmount);
        cy.get("#notes").type("5571 ordering regression");
        cy.get("[data-cy=add-funding-received-btn]", { timeout: 20000 }).should("be.enabled").click();

        // Save. Both the budget and the received mutations fire from one Save.
        cy.get("[data-cy=save-btn]").should("be.enabled").click();
        cy.wait("@canFundingBudgetPatch", { timeout: 30000 });
        cy.wait("@canFundingReceived", { timeout: 30000 });
        cy.get(".usa-alert__body").should("contain", `The CAN ${can.nickname} has been successfully updated.`);

        // Navigate to the CAN history panel.
        cy.visit(`/cans/${can.number}`);
        cy.get('[data-cy="can-history-list"]', { timeout: 15000 }).should("exist");

        // History is sorted newest-first. The user did:
        //   1. Enter FY Budget   → older
        //   2. Add Funding Received → newer
        // So "Funding Received Added" must appear before the FY Budget entry.
        // Prior test runs may have left additional history entries, so we check
        // relative ordering rather than fixed positions.
        const budgetPattern = new RegExp(`^FY ${currentFiscalYear} Budget (Entered|Edited)$`);

        cy.get('[data-cy="can-history-list"] [data-cy="log-item-title"]').then(($titles) => {
            const titles = [...$titles].map((el) => el.textContent.replace(/\s+/g, " ").trim());
            const receivedIndex = titles.indexOf("Funding Received Added");
            const budgetIndex = titles.findIndex((t) => budgetPattern.test(t));

            expect(receivedIndex, "Funding Received Added should be in history").to.be.at.least(0);
            expect(budgetIndex, "FY Budget entry should be in history").to.be.at.least(0);
            expect(receivedIndex, "Funding Received should appear before (newer than) FY Budget").to.be.lessThan(
                budgetIndex
            );
        });
    });
});
