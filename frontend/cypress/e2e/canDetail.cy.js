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
    budgetAmount: "5000000",
    updatedBudgetAmount: "8000000"
};
// NOTE: CAN 527 is a zero year CAN and will not expire
const can527 = {
    number: 527,
    nickname: "G995679",
    budgetAmount: "5000000",
    updatedBudgetAmount: "8000000"
};

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

const extractCurrency = (text) => {
    const match = text.match(/\$\s*[\d,]+(?:\.\d{2})?/);
    return match ? match[0].replace(/\s+/g, " ").trim() : "";
};

const extractReceivedSummary = (text) => {
    const match = text.match(/Received\s*\$[\d,]+\.\d{2}\s*of\s*\$[\d,]+\.\d{2}/);
    return match ? match[0].replace(/\s+/g, " ").trim() : "";
};

const normalizeText = (text) => {
    if (!text) {
        return "";
    }
    return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
};

const parseCurrencyValue = (text) => {
    if (!text) {
        return 0;
    }
    const match = text.match(/[\d,]+(?:\.\d{2})?/);
    return match ? Number(match[0].replace(/,/g, "")) : 0;
};

const parseMoneyInputValue = (value, expected) => {
    const raw = String(value || "").trim();
    if (!raw) {
        return 0;
    }
    // Some money inputs store their internal value as cents (e.g., "500000055")
    // even when the UI displays "$5,000,000.55". Prefer decimal parsing when present.
    const normalized = raw.replace(/[^0-9.]/g, "");
    if (!normalized) {
        return 0;
    }
    if (normalized.includes(".")) {
        return Number(normalized);
    }
    const asNumber = Number(normalized);
    if (Number.isNaN(asNumber)) {
        return 0;
    }
    // If the input stores cents (e.g. "500000055"), choose the interpretation
    // that is closer to the expected value (when provided).
    const asDollars = asNumber;
    const asCents = asNumber / 100;
    const expectedNumber = Number(expected);
    if (Number.isFinite(expectedNumber)) {
        return Math.abs(asCents - expectedNumber) < Math.abs(asDollars - expectedNumber) ? asCents : asDollars;
    }
    // When we don't have a reliable expected value, default to dollars.
    return asDollars;
};

const formatCurrencyValue = (value) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
        return "";
    }
    return numberValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const extractCurrencyValues = (text) => {
    const normalized = normalizeText(text);
    const matches = normalized.match(/(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2}/g) || [];
    return matches.map((value) => Number(value.replace(/,/g, "")));
};

const waitForCurrencyContent = (selector, timeout = 20000) => {
    cy.get(selector, { timeout }).should(($el) => {
        const text = normalizeText($el.text());
        // Ensure a currency amount has rendered (ignore years like 2024 by requiring a leading '$').
        expect(text).to.match(/\$\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?/);
    });
};

const waitForBudgetReceivedTotal = (expectedTotal, timeout = 60000) => {
    const expectedNumber = Number(expectedTotal);
    cy.get("[data-cy=budget-received-card]", { timeout }).should(($el) => {
        const { total } = extractReceivedTotals($el.text());
        expect(total).to.be.closeTo(expectedNumber, 0.01);
    });
};

const waitForBudgetReceivedAmount = (expectedReceived, timeout = 60000) => {
    const expectedNumber = Number(expectedReceived);
    cy.get("[data-cy=budget-received-card]", { timeout }).should(($el) => {
        const { received } = extractReceivedTotals($el.text());
        expect(received).to.be.closeTo(expectedNumber, 0.01);
    });
};

const waitForElementToContainCurrencyValue = (selector, expectedValue, timeout = 60000) => {
    const expectedNumber = Number(expectedValue);
    cy.get(selector, { timeout }).should(($el) => {
        const rawValues = extractCurrencyValues($el.text());
        const parsedValues = Number.isFinite(expectedNumber)
            ? rawValues.map((value) => parseMoneyInputValue(String(value), expectedNumber))
            : rawValues;
        const found = parsedValues.some((value) => Math.abs(value - expectedNumber) <= 0.01);
        expect(
            found,
            `Expected ${selector} currency values to include ${expectedNumber}; got raw=[${rawValues.join(
                ", "
            )}] parsed=[${parsedValues.join(", ")}]`
        ).to.eq(true);
    });
};

const extractReceivedTotals = (text) => {
    const normalized = normalizeText(text);
    const match = normalized.match(
        /Received\s*\$?\s*([\d,]+(?:\.\d{2})?)\s*of\s*\$?\s*([\d,]+(?:\.\d{2})?)/i
    );
    if (match) {
        return {
            received: Number(match[1].replace(/,/g, "")),
            total: Number(match[2].replace(/,/g, ""))
        };
    }
    const values = extractCurrencyValues(normalized);
    if (values.length === 0) {
        return { received: 0, total: 0 };
    }
    if (values.length === 1) {
        return { received: 0, total: values[0] };
    }
    const sorted = [...values].sort((a, b) => a - b);
    return { received: sorted[0], total: sorted[sorted.length - 1] };
};

const computeBudgetTarget = (received, total, increment = 1000000.01) => {
    const baseline = Math.max(received, total, 0);
    return Number((baseline + increment).toFixed(2));
};

const currentFiscalYear = getCurrentFiscalYear();

const setMoneyInputValue = (selector, value) => {
    const expected = Number(String(value).replace(/,/g, ""));
    const typeValue = (delayMs) => {
        cy.get(selector)
            .should("be.visible")
            .and("not.be.disabled")
            .click({ force: true })
            .type("{selectall}{backspace}", { force: true })
            .type(`${value}`, { delay: delayMs, force: true })
            .blur();

        cy.get(selector).trigger("change", { force: true });
    };

    // React 19 + react-currency-format can occasionally drop characters in CI.
    // Try a fast pass first; retry with a small delay only if needed.
    typeValue(0);

    cy.get(selector)
        .invoke("val")
        .then((val) => {
            if (!Number.isFinite(expected)) {
                return;
            }
            const parsed = parseMoneyInputValue(val, expected);
            if (Math.abs(parsed - expected) <= 0.01) {
                // Avoid strict float equality; currency inputs can round as they format.
                expect(parsed).to.be.closeTo(expected, 0.01);
                return;
            }

            typeValue(25);
            cy.get(selector)
                .invoke("val")
                .then((retryVal) => {
                    const parsedRetry = parseMoneyInputValue(retryVal, expected);
                    expect(parsedRetry).to.be.closeTo(expected, 0.01);
                });
        });
};

describe("CAN detail page", () => {
    it("shows the CAN details page", () => {
        cy.visit("/cans/502/");
        cy.get("h1").should("contain", "G99PHS9"); // heading
        cy.get("p").should("contain", can502Nickname); // sub-heading
        cy.get("span").should("contain", "Sheila Celentano"); // team member
        cy.get("span").should("contain", "Director Derrek"); // division director
        cy.get("span").should("contain", "OCDO"); // portfolio
        cy.get("span").should("contain", "OCDO"); // division
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
        // Check that all expected messages exist in the history list, regardless of order
        const expectedMessages = [
            "Budget Team edited the nickname from Test Can Nickname to SSRD", // due to revert back to original values
            "Budget Team edited the description", // due to revert back to original values
            "Budget Team edited the nickname from SSRD to Test Can Nickname"
        ];
        cy.get('[data-cy="log-item-message"]').then(($messages) => {
            expectedMessages.forEach((expectedMessage) => {
                cy.wrap($messages).should("contain", expectedMessage);
            });
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
        cy.get("tbody").children().should("have.length", 10);
        // all table rows should have FY 2043 in the FY column
        cy.get("tbody")
            .children()
            .each(($el) => {
                cy.wrap($el).should("contain", "2043");
            });
        cy.get("#big-budget-summary-card").should("exist");
        cy.get("#big-budget-summary-card").should("contain", "-$ 120,797,640.00");
        cy.get("#project-agreement-bli-card").should("exist");
        cy.get("span").should("contain", "13 Draft");
        cy.get("span").should("contain", "13 Planned");
        cy.get("span").should("contain", "8 Executing");
        cy.get("span").should("contain", "8 Obligated");
        cy.get("span").should("not.contain", "1 OBE");
        cy.get("#donut-graph-with-legend-card")
            .should("contain", "0%")
            .and("contain", "0%")
            .and("contain", "0%")
            .and("contain", "0%")
            .and("contain", "$36,943,280.00")
            .and("contain", "$67,648,053.00")
            .and("contain", "$26,204,081.00")
            .and("contain", "$26,945,506.00");
        cy.get("#fiscal-year-select").select("2022");
        // table should not exist
        cy.get("tbody").should("not.exist");
        cy.get("p").should("contain", "No budget lines have been added to this CAN.");
    });
    // NOTE: Skipping this test since we need to check that BLIS are in FY
    it.skip("pagination on the bli table works as expected", () => {
        cy.visit("/cans/504/spending");
        cy.get("#fiscal-year-select").select("2043");
        // Wait for pagination to reload
        cy.get("ul.usa-pagination__list", { timeout: 10000 }).should("be.visible");
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

    it("should handle budget lines without agreement", () => {
        cy.visit("/cans/520/spending");
        cy.get("#fiscal-year-select").select("2022");
        cy.get("#big-budget-summary-card").should("contain", "Spending $4,162,025.00 of $4,162,025.00");
        cy.get("span").should("contain", "2 Draft");
        cy.get("span").should("contain", "1 Planned");
        cy.get("#donut-graph-with-legend-card")
            .should("contain", "100%")
            .should("contain", "100%")
            .should("contain", "0%")
            .should("contain", "0%");
        cy.get("tbody").children().should("have.length", 3);
        // check the second row for containing TBD
        cy.get("tbody").children().eq(1).should("contain", "TBD");
    });
});

describe("CAN funding page", () => {
    beforeEach(() => {
        cy.intercept("POST", "**/api/v1/can-funding-budgets/**").as("canFundingBudget");
        cy.intercept("PATCH", "**/api/v1/can-funding-budgets/**").as("canFundingBudget");
        cy.intercept("POST", "**/api/v1/can-funding-received/**").as("canFundingReceived");
        cy.intercept("PATCH", "**/api/v1/can-funding-received/**").as("canFundingReceived");
        cy.intercept("DELETE", "**/api/v1/can-funding-received/**").as("canFundingReceived");
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
        cy.visit(`/cans/${can527.number}/funding`);
        cy.get("#edit", { timeout: 20000 }).should("be.visible").click();
        closeWelcomeModalIfPresent();
        // cy.get("#carry-forward-card").should("contain", "$ 578,023.00");
        cy.get("#save-changes", { timeout: 20000 }).should("be.disabled");
        cy.get("#carry-forward-card").should("exist");
        cy.get("[data-cy='can-budget-fy-card']").should("exist");
        cy.get("[data-cy=budget-received-card]").should("contain", "Received");
        waitForCurrencyContent("[data-cy=budget-received-card]");
        setMoneyInputValue("#budget-amount", can527.budgetAmount);
        cy.get(".usa-error-message").should("not.exist");
        cy.get("#add-fy-budget").should("be.enabled").click();
        cy.get("#save-changes").should("be.enabled");
        waitForElementToContainCurrencyValue("[data-cy='can-budget-fy-card']", can527.budgetAmount);
        cy.get("#save-changes").click();
        cy.wait("@canFundingBudget", { timeout: 30000 });
        cy.get(".usa-alert__body").should("contain", `The CAN ${can527.nickname} has been successfully updated.`);
        waitForBudgetReceivedTotal(can527.budgetAmount);
        cy.get("[data-cy=can-budget-fy-card]")
            .should("exist")
            .and("contain", "CAN Budget by FY")
            .and("contain", `FY ${currentFiscalYear}`)
            .and(($el) => {
                const text = $el.text();
                expect(parseCurrencyValue(text)).to.be.greaterThan(0);
            });
        // check can history for ADDING a budget
        cy.visit(`/cans/${can527.number}`);
        cy.get('[data-cy="can-history-list"]').should("exist");
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]')
            .should("exist")
            .invoke("text")
            .then((text) => {
                const titlePattern = new RegExp(`FY ${currentFiscalYear} Budget (Entered|Edited)`);
                expect(text.replace(/\s+/g, " ").trim()).to.match(titlePattern);
            });

        // Check that all expected messages exist in the history list, regardless of order
        cy.get('[data-cy="log-item-message"]').then(($messages) => {
            const historyText = $messages.text().replace(/\s+/g, " ").trim();
            const budgetPattern = new RegExp(`Budget Team (entered|edited) (the|a) FY ${currentFiscalYear} budget`);
            expect(historyText).to.match(budgetPattern);
        });
    });
    it("shows history message when updating a budget", () => {
        // update the budget amount
        cy.visit(`/cans/${can527.number}/funding`);
        cy.get("#edit", { timeout: 15000 }).should("be.visible").and("not.be.disabled");
        cy.get("#edit").click();
        closeWelcomeModalIfPresent();
        cy.get("#budget-amount", { timeout: 20000 }).should("be.visible").and("not.be.disabled");
        cy.get("[data-cy=budget-received-card]").should("contain", "Received");
        waitForCurrencyContent("[data-cy=budget-received-card]");
        setMoneyInputValue("#budget-amount", can527.updatedBudgetAmount);
        cy.get("#add-fy-budget").should("be.enabled").click();
        cy.get("#save-changes").should("be.enabled");
        waitForElementToContainCurrencyValue("[data-cy='can-budget-fy-card']", can527.updatedBudgetAmount);
        cy.get("#save-changes").click();
        cy.wait("@canFundingBudget", { timeout: 30000 });

        // check can history for UPDATING a budget
        cy.visit(`/cans/${can527.number}`);
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]')
            .should("exist")
            .contains(`FY ${currentFiscalYear} Budget Edited`);

        cy.get('[data-cy="log-item-message"]').then(($messages) => {
            const historyText = $messages.text().replace(/\s+/g, " ").trim();
            const budgetPattern = new RegExp(`Budget Team edited the FY ${currentFiscalYear} budget`);
            expect(historyText).to.match(budgetPattern);
            expect(historyText).to.contain(formatCurrencyValue(can527.updatedBudgetAmount));
        });
    });
    it("handle funding received form", () => {
        cy.visit(`/cans/${can527.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit", { timeout: 20000 }).should("be.visible").and("not.be.disabled").click();
        closeWelcomeModalIfPresent();
        cy.get("[data-cy=budget-received-card]").should("contain", "Received");
        waitForCurrencyContent("[data-cy=budget-received-card]");
        cy.get("[data-cy=budget-received-card]")
            .invoke("text")
            .then((text) => {
                const { received, total } = extractReceivedTotals(text);
                const maxAllowed = Math.max(Math.floor(total - received - 1), 1);
                const baseAmount = Math.min(1000000, maxAllowed);
                const editAmount = Math.min(baseAmount + 1000, maxAllowed);
                const deleteAmount = Math.min(baseAmount + 2000, maxAllowed);
                const overBudgetAmount = Math.ceil(total + 1);
                cy.wrap({ baseAmount, editAmount, deleteAmount, overBudgetAmount }).as("fundingAmounts");
            });
        // check that buttons are disabled when no amount is entered
        cy.get("#funding-received-amount").clear();
        cy.get("[data-cy=add-funding-received-btn]").should("be.disabled");
        cy.get("[data-cy=save-btn]").should("exist");
        // enter amount into input
        cy.get("@fundingAmounts").then(({ baseAmount }) => {
            setMoneyInputValue("#funding-received-amount", baseAmount);
            cy.get("[data-cy=add-funding-received-btn]", { timeout: 60000 }).should("be.enabled");
        });
        // clear and check validation
        cy.get("#funding-received-amount").clear();
        cy.get("[data-cy=add-funding-received-btn]").should("be.disabled");
        // Test received amount over budget amount
        cy.get("@fundingAmounts").then(({ overBudgetAmount }) => {
            setMoneyInputValue("#funding-received-amount", overBudgetAmount);
            cy.get("[data-cy=add-funding-received-btn]").should("be.disabled");
            cy.get(".usa-error-message").should("exist").contains("Amount cannot exceed FY Budget");
        });
        cy.get("#funding-received-amount").clear();
        cy.get("@fundingAmounts").then(({ baseAmount }) => {
            setMoneyInputValue("#funding-received-amount", baseAmount);
            cy.get("[data-cy=add-funding-received-btn]", { timeout: 60000 }).should("be.enabled");
        });
        // enter and click on add funding received
        cy.get("#notes").type("Test notes");
        cy.get("[data-cy=add-funding-received-btn]").click();
        // check card on the right
        cy.get("@fundingAmounts").then(({ baseAmount }) => {
            waitForBudgetReceivedAmount(baseAmount);
        });
        // edit a funding from table interaction
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').should("exist");
        cy.get("tbody").find("tr").first().find('[data-cy="delete-row"]').should("exist");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').click();
        // verify form is populated correctly
        cy.get("#notes").invoke("val").should("equal", "Test notes");
        // edit funding received form
        cy.get("#funding-received-amount").clear();
        cy.get("@fundingAmounts").then(({ editAmount }) => {
            setMoneyInputValue("#funding-received-amount", editAmount);
            cy.get("[data-cy=add-funding-received-btn]").click();
            waitForBudgetReceivedAmount(editAmount);
        });
        // validation check to ensure amount does not exceed budget amount
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').click();
        cy.get("#funding-received-amount").clear();
        cy.get("@fundingAmounts").then(({ overBudgetAmount }) => {
            setMoneyInputValue("#funding-received-amount", overBudgetAmount); // amount is over the budget
            cy.get("[data-cy=add-funding-received-btn]").should("be.disabled");
            cy.get(".usa-error-message").should("exist").contains("Amount cannot exceed FY Budget");
        });
        cy.get("[data-cy=cancel-funding-received-btn]").click();
        // delete a funding received from table
        cy.get("@fundingAmounts").then(({ deleteAmount, editAmount }) => {
            setMoneyInputValue("#funding-received-amount", deleteAmount);
            cy.get("#notes").type("Delete me please");
            cy.get("[data-cy=add-funding-received-btn]").click();
            cy.get("tbody").find("tr").eq(1).trigger("mouseover");
            cy.get("tbody").find("tr").eq(1).find('[data-cy="delete-row"]').click();
            cy.get("[data-cy=confirm-action]").click();
            cy.get("tbody").children().should("have.length", 1);
             // make sure the funding received card on the right updates
            waitForBudgetReceivedAmount(editAmount);
        });
        // click on save button at bottom of form
        cy.get("[data-cy=save-btn]").click();
        cy.wait("@canFundingReceived");
        // check success alert
        cy.get(".usa-alert__body").should("contain", `The CAN ${can527.nickname} has been successfully updated.`);
        // check that table and card are updated
        cy.get("@fundingAmounts").then(({ editAmount }) => {
            waitForBudgetReceivedAmount(editAmount);
            cy.get("tbody").children().should("contain", currentFiscalYear).and("contain", formatCurrencyValue(editAmount));
        });

        // check can history for ADDING a funding received event
        cy.visit(`/cans/${can527.number}`);
        cy.get('[data-cy="can-history-list"]').should("exist");
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]')
            .should("exist")
            .contains("Funding Received Added");

        cy.get('[data-cy="log-item-message"]').then(($messages) => {
            const historyText = $messages.text().replace(/\s+/g, " ").trim();
            expect(historyText).to.contain("Budget Team added funding received");
        });
    });
    it("shows correct total funding received when switching between fiscal years", () => {
        // have to visit the cans page first to set the fiscal year and recreate the bug
        cy.visit(`/cans`);
        cy.get("#fiscal-year-select").select("2023");
        cy.visit(`/cans/510/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        closeWelcomeModalIfPresent();
        // budget-received-card should show $ 0
        cy.get("[data-cy=budget-received-card]").should("contain", "$ 0");
    });
    it.skip("handle posting, patching, and deleting funding received", () => {
        // this test is skipped because it relies on side effects from other tests and is not deterministic

        // create a new funding received -- POST
        cy.visit(`/cans/${can504.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("#funding-received-amount").type("1000000");
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
        // Wait for save to complete by checking edit button is available
        cy.get("#edit", { timeout: 10000 }).should("be.visible");
        // go back to editing mode and delete a funding received -- DELETE
        cy.get("#edit").click();
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="delete-row"]').click();
        cy.get("tbody").children().should("have.length", 1);
        // save the changes
        cy.get("[data-cy=save-btn]").click();

        // check can history for DELETING a funding received event
        cy.visit(`/cans/${can504.number}`);
        // Wait for history to be generated and loaded
        cy.get('[data-cy="can-history-list"]', { timeout: 10000 }).should("exist");
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]')
            .should("exist")
            .contains("Funding Received Deleted");

        // Check that all expected messages exist in the history list, regardless of order
        const expectedMessages = [
            "Budget Team deleted funding received for funding ID 527 in the amount of $1,000,000.00",
            "Budget Team added funding received to funding ID 527 in the amount of $1,000,000.00",
            "Budget Team added funding received to funding ID 526 in the amount of $2,000,000.00"
        ];
        cy.get('[data-cy="log-item-message"]').then(($messages) => {
            expectedMessages.forEach((expectedMessage) => {
                cy.wrap($messages).should("contain", expectedMessage);
            });
        });
    });
    it.skip("shows history message when updating a funding received", () => {
        // this test is skipped because it relies on side effects from other tests and is not deterministic
        cy.visit(`/cans/${can504.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("tbody").find("tr").first().trigger("mouseover");
        cy.get("tbody").find("tr").first().find('[data-cy="edit-row"]').click();
        cy.get("#funding-received-amount").clear();
        cy.get("#funding-received-amount").type("3500000");
        cy.get("[data-cy=add-funding-received-btn]").click();
        cy.get("[data-cy=save-btn]").click();

        cy.wait(1000); // wait for the history to be generated in the API

        // check can history for UPDATING a funding received event
        cy.visit(`/cans/${can504.number}`);
        cy.get('[data-cy="can-history-list"]').should("exist");
        cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]')
            .should("exist")
            .contains("Funding Received Edited");

        // Check that all expected messages exist in the history list, regardless of order
        const expectedMessages = [
            "Budget Team edited funding received for funding ID 526 from $2,000,000.00 to $3,500,000.00",
            "Budget Team deleted funding received for funding ID 527 in the amount of $1,000,000.00",
            "Budget Team added funding received to funding ID 527 in the amount of $1,000,000.00"
        ];
        cy.get('[data-cy="log-item-message"]').then(($messages) => {
            expectedMessages.forEach((expectedMessage) => {
                cy.wrap($messages).should("contain", expectedMessage);
            });
        });
    });
    it("handles cancelling from budget form", () => {
        cy.visit(`/cans/${can527.number}/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit", { timeout: 20000 }).should("be.visible").and("not.be.disabled").click();
        closeWelcomeModalIfPresent();
        // cy.get("#carry-forward-card").should("contain", "$ 10,000,000.00");
        cy.get("[data-cy='can-budget-fy-card']")
            .invoke("text")
            .then((text) => {
                cy.wrap(extractCurrency(text)).as("initialBudget");
            });
        cy.get("[data-cy=budget-received-card]").should("contain", "Received");
        waitForCurrencyContent("[data-cy=budget-received-card]");
        cy.get("[data-cy=budget-received-card]")
            .invoke("text")
            .then((text) => {
                cy.wrap(extractReceivedSummary(text)).as("initialReceivedSummary");
            });
        cy.get("[data-cy=budget-received-card]")
            .invoke("text")
            .then((text) => {
                const { received, total } = extractReceivedTotals(text);
                const cancelBudget = computeBudgetTarget(received, total, 500000);
                cy.wrap(cancelBudget).as("cancelBudget");
            });
        cy.get("@cancelBudget").then((cancelBudget) => {
            const inputValue = Number(cancelBudget).toFixed(2);
            setMoneyInputValue("#budget-amount", inputValue);
        });
        cy.get("#add-fy-budget").click();
        cy.get("@cancelBudget").then((cancelBudget) => {
            waitForElementToContainCurrencyValue("[data-cy='can-budget-fy-card']", cancelBudget);
        });
        cy.get("#save-changes").should("be.enabled");
        // test funding received form
        cy.get("#funding-received-amount").type("1000000");
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
        cy.get("@initialReceivedSummary").then((summary) => {
            if (summary) {
                cy.get("[data-cy=budget-received-card]").should("exist").and("contain", summary);
            } else {
                cy.get("[data-cy=budget-received-card]").should("exist");
            }
        });
        cy.get("@initialBudget").then((budget) => {
            if (budget) {
                const budgetValue = parseCurrencyValue(budget);
                cy.get("[data-cy=can-budget-fy-card]")
                    .should("exist")
                    .and("contain", "CAN Budget by FY")
                    .and("contain", `FY ${currentFiscalYear}`);
                waitForElementToContainCurrencyValue("[data-cy='can-budget-fy-card']", budgetValue);
            } else {
                cy.get("[data-cy=can-budget-fy-card]").should("exist");
            }
        });
        // check table has one row
        cy.get("tbody").children().should("have.length", 1);
    });
    // skipping this test since we can only currently edit the current fiscal year and since there will not be any
    // carry forward amount after the first fiscal year we will need to add a new can each year to test this
    // functionality
    // when we can edit prior fiscal years we can unskip this test
    it.skip("handles not showing carry forward card", () => {
        cy.visit(`/cans/525/funding`);
        cy.get("#fiscal-year-select").select(currentFiscalYear);
        cy.get("#edit").click();
        cy.get("[data-cy=confirm-action]").click();
        cy.get("#carry-forward-card").should("not.exist");
    });
});

// const checkCANHistory = () => {
//     cy.get("h3").should("have.text", "History");
//     cy.get('[data-cy="can-history-container"]').should("exist");
//     cy.get('[data-cy="can-history-container"]').scrollIntoView();
//     cy.get('[data-cy="can-history-list"]').should("exist");
//     cy.get('[data-cy="can-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]').should("exist");
// };
