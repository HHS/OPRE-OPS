/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("agreement change accordion", () => {
    it("handles interactions", () => {
        cy.visit("/agreements/review/1").wait(1000);
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
        cy.get('[type="checkbox"]')
            .should("have.length", 4)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        cy.get('[data-cy="can-funding-summary-card-504"]').within(() => {
            cy.contains("$5,000,000");
            cy.contains("$ 35,000,000");
            cy.contains("$40,000,000");
            cy.contains("G994426-5Y");
        });
        cy.get('[data-cy="currency-summary-card"]').contains("$ 2,000,000.00");
        cy.get("h2").contains("Review Changes").as("info-accordion").should("exist");
        // get content in review-card to see if it exists and contains planned, status and amount
        cy.get("[data-cy='review-card']").each(($card) => {
            cy.wrap($card).within(() => {
                cy.contains(/15000|15001/);
                cy.contains(/draft/i);
                cy.contains(/planned/i);
                cy.contains(/status/i);
                cy.contains(/total/i);
                cy.contains("$1,000,000.00");
            });
        });
    });
    it("handles interactions", () => {
        cy.visit("/agreements/review/9").wait(1000);
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
            cy.wait(1);
        });
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        cy.get('[data-cy="can-funding-summary-card-502"]').within(() => {
            cy.contains("$10,403,500");
            cy.contains("$ 13,596,500");
            cy.contains("$24,000,000");
            cy.contains("G99PHS9-5Y");
        });
        cy.get('[data-cy="can-funding-summary-card-512"]').within(() => {
            cy.contains("$602,000");
            cy.contains("$ 1,678,000");
            cy.contains("$2,280,000");
            cy.contains("G99XXX8-5Y");
        });
        cy.get('[data-cy="currency-summary-card"]').within(() => {
            cy.contains("$ 1,005,000.00");
            cy.contains("$1,000,000.00");
            cy.contains("$5,000.00");
            cy.contains("NIH - Fee Rate: 0.5%");
        });
        cy.get("h2").contains("Review Changes").as("info-accordion").should("exist");
        // get content in review-card to see if it exists and contains planned, status and amount
        cy.get("[data-cy='review-card']").each(($card) => {
            cy.wrap($card).within(() => {
                cy.contains(/15020|15021/);
                cy.contains(/planned/i);
                cy.contains(/executing/i);
                cy.contains(/status/i);
                cy.contains(/total/i);
                cy.contains(/703,500.00|301,500.00/);
            });
        });
    });
});

describe("agreement BLI accordion", () => {
    it("should contain summary card", () => {
        cy.visit("/agreements/review/1");
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get('[data-cy="blis-by-fy-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').should("exist");
    });

    it("allow to select individual budget lines", () => {
        cy.visit("/agreements/review/1").wait(1000);
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.get("#15000").check({ force: true });
        cy.get("#15001").check({ force: true });
    });

    it("should handle check-all and uncheck all", () => {
        cy.visit("/agreements/review/1").wait(1000);
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get('[data-cy="check-all"]').should("exist").should("be.disabled");
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
        // all checkboxes should be checked
        cy.get('[type="checkbox"]')
            .should("have.length", 4)
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
            .should("have.length", 4)
            .each((checkbox) => {
                cy.wrap(checkbox).should("not.be.checked");
            });
    });

    it("should handle after approval toggle on Agreement1", () => {
        cy.visit("/agreements/review/1").wait(1000);
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

    it("should handle after approval toggle on Agreement 2", () => {
        cy.visit("/agreements/review/2").wait(1000);
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        cy.get('[data-cy="check-all"]').each(($el) => {
            cy.wrap($el).check({ force: true });
            cy.wait(1);
        });
        cy.get('[data-cy="currency-summary-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').contains("$32,000,000.00");
    });
});

describe("agreement action accordion", () => {
    it("should have draft option available on agreement one", () => {
        cy.visit("/agreements/review/1").wait(1000);
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get("@acc-btn").type("{enter}");
        cy.get('input[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("be.disabled");
    });

    it("should have planned option available on agreement nine", () => {
        cy.visit("/agreements/review/9");
        cy.get("h2").contains("Choose a Status Change").as("acc-btn").should("exist");
        cy.get("@acc-btn").type("{enter}");
        cy.get('input[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("be.disabled");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("not.be.disabled");
    });
});

describe("agreement review CANS accordion", () => {
    it("should not have any CANS cards unless BLIs are selected", () => {
        cy.visit("/agreements/review/1").wait(1000);
        // pre-change
        cy.get("h2").contains("Review CANs").should("exist");
        cy.get('[data-cy="can-funding-summary-card"]').should("not.exist");
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
        cy.get('[type="checkbox"]')
            .should("have.length", 4)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        cy.get('[data-cy="can-funding-summary-card-504"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-504"]').contains("$40,000,000");
    });

    it("should handle after approval toggle", () => {
        cy.visit("/agreements/review/1").wait(1000);
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
        cy.get('[type="checkbox"]')
            .should("have.length", 4)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        cy.get('[data-cy="can-funding-summary-card-504"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-504"]').contains("5,000,000");
        cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
        cy.get('[data-cy="can-funding-summary-card-504"]').contains("3,000,000");
    });

    it("should handle over budget CANs", () => {
        cy.visit("/agreements/review/2").wait(1000);
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
        cy.get('[type="checkbox"]').should("have.length", 17);
        cy.get('[data-cy="can-funding-summary-card-507"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-508"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-507"]').contains("Over Budget");
        cy.get('[data-cy="can-funding-summary-card-508"]').contains("Over Budget");
    });
});

describe("Additional Information accordion", () => {
    it("should not have any additional information unless BLIs are selected", () => {
        cy.visit("/agreements/review/9").wait(1000);
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        // info-accordion should exist
        cy.get("h2").contains("Additional Information").as("info-accordion").should("exist");
        cy.get("h2").contains("Review Documents").as("info-accordion").should("exist");
    });
});

describe("Should not allow non-team members from submitting status changes", () => {
    it("should disable submit button", () => {
        testLogin("basic");
        cy.visit("/agreements/9/budget-lines").wait(1000);
        cy.get("span").contains("Plan or Execute Budget Lines").should("have.attr", "aria-disabled", "true");
    });
    it("should show error page", () => {
        testLogin("basic");
        cy.visit("/agreements/review/9").wait(1000);
        cy.get("h1").contains("Something went wrong").should("exist");
    });
});
