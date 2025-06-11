/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("agreement change accordion", () => {
    it("handles interactions on agreement 1", () => {
        cy.visit("/agreements/review/10").wait(1000);
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get('[data-cy="check-all"]').should("exist").should("be.disabled");
        cy.get('[data-cy="can-total-card-G994426"]').should("not.exist");
        // click action radio button
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
            cy.wait(1);
        });
        cy.get('[type="checkbox"]').should("have.length", 3).first().should("be.checked");
        cy.get('[data-cy="budget-summary-card-504"]').within(() => {
            cy.contains("146,624,958");
            cy.contains("186,624,958");
            cy.contains("40,000,000");
            cy.contains("G994426-5Y");
        });
        cy.get('[data-cy="currency-summary-card"]').contains("$ 2,000,000.00");
        cy.get("h2").contains("Review Changes").as("info-accordion").should("exist");
        // get content in review-card to see if it exists and contains planned, status and amount
        cy.get("[data-cy='review-card']").each(($card) => {
            cy.wrap($card).within(() => {
                cy.contains(/15003/);
                cy.contains(/draft/i);
                cy.contains(/planned/i);
                cy.contains(/status/i);
                cy.contains(/total/i);
                cy.contains("$1,000,000.00");
            });
        });
    });
    it("handles interactions on agreement 10", () => {
        cy.visit("/agreements/review/10").wait(1000);
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get('[data-cy="check-all"]').should("exist").should("be.disabled");
        // click action radio button
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
            cy.wait(1000);
        });
        cy.get('[type="checkbox"]').should("have.length", 3).last().should("be.checked");
        cy.get('[data-cy="budget-summary-card-504"]').within(() => {
            cy.contains("146,624,958");
            cy.contains("186,624,958");
            cy.contains("40,000,000");
            cy.contains("G994426-5Y");
        });
        cy.get("h2").contains("Review Changes").as("info-accordion").should("exist");
        cy.get("h2").contains("Upload Documents").as("info-accordion").should("exist");
        cy.contains("p", "Please coordinate documents related to pre-solicitation");
        // get content in review-card to see if it exists and contains planned, status and amount
        cy.get("[data-cy='review-card']").each(($card) => {
            cy.wrap($card).within(() => {
                cy.contains(/15002/);
                cy.contains(/planned/i);
                cy.contains(/executing/i);
                cy.contains(/status/i);
                cy.contains(/total/i);
                cy.contains(/1,000,000.00/);
            });
        });
    });
});

describe("agreement BLI accordion", () => {
    it("should contain summary card", () => {
        cy.visit("/agreements/review/10");
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get('[data-cy="blis-by-fy-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').should("exist");
    });

    it("allow to select individual budget lines", () => {
        cy.visit("/agreements/review/10").wait(1000);
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.get("#15003").check({ force: true });
    });

    it("should handle check-all and uncheck all", () => {
        cy.visit("/agreements/review/9").wait(1000);
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get('[data-cy="check-all"]').should("exist").should("be.disabled");
        // click action radio button
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').last().check({ force: true });
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
            cy.wait(1);
        });
        // all checkboxes should be checked
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        // uncheck all
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).uncheck({ force: true });
            cy.wait(1);
        });
        // all checkboxes should be unchecked
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("not.be.checked");
            });
    });

    it("should handle after approval toggle on Agreement10", () => {
        cy.visit("/agreements/review/10").wait(1000);
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
            cy.wait(1);
        });
        cy.get('[data-cy="button-toggle-After Approval"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').contains("2,000,000");
        cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
        cy.get('[data-cy="currency-summary-card"]').contains("0");
    });

    it("should handle after approval toggle on Agreement 10", () => {
        cy.visit("/agreements/review/10").wait(1000);
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
            cy.wait(1);
        });
        cy.get('[data-cy="currency-summary-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').contains("$1,000,000.00");
    });
});

describe("agreement review CANS accordion", () => {
    it("should not have any CANS cards unless BLIs are selected", () => {
        cy.visit("/agreements/review/10").wait(1000);
        // pre-change
        cy.get("h2").contains("Review CANs").should("exist");
        cy.get('[data-cy="budget-funding-summary-card"]').should("not.exist");
        // select all BLIs to show CANS cards
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.wait(1);
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
            cy.wait(1);
        });
        cy.get('[type="checkbox"]').should("have.length", 3).first().should("be.checked");
        cy.get('[data-cy="budget-summary-card-504"]').should("exist");
        cy.get('[data-cy="budget-summary-card-504"]').contains("$40,000,000");
    });

    it("should handle after approval toggle", () => {
        cy.visit("/agreements/review/10").wait(1000);
        // pre-change
        // select all BLIs to show CANS cards
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.wait(1);
        cy.get('[data-cy="button-toggle-After Approval"]').should("exist");
        cy.get('[data-cy="button-toggle-After Approval"]').first().should("exist");
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
            cy.wait(1);
        });
        cy.get('[type="checkbox"]').should("have.length", 3).first().should("be.checked");
        cy.get('[data-cy="budget-summary-card-504"]').should("exist");
        cy.get('[data-cy="budget-summary-card-504"]').contains("146,624,958.00");
        cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
        cy.get('[data-cy="budget-summary-card-504"]').contains("145,624,958.00");
    });

    it("should handle over budget CANs", () => {
        cy.visit("/agreements/review/10").wait(1000);
        // pre-change
        // select all BLIs to show CANS cards
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        cy.wait(1);
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
            cy.wait(1);
        });
        cy.get('[type="checkbox"]').should("have.length", 3);
        cy.get('[data-cy="budget-summary-card-504"]').should("exist").contains("Over Budget");
    });
});

describe("Should not allow non-team members from submitting status changes", () => {
    it("should disable submit button", () => {
        testLogin("basic");
        cy.visit("/agreements/9/budget-lines").wait(1000);
        cy.get("span").contains("Request BL Status Change").should("have.attr", "aria-disabled", "true");
    });
    it("should show error page", () => {
        testLogin("basic");
        cy.visit("/agreements/review/9").wait(1000);
        cy.get("h1").contains("Something went wrong").should("exist");
    });
});
