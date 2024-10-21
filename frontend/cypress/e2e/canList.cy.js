/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("division-director");
    cy.visit("/cans").wait(1000);
    cy.get("#fiscal-year-select").select("2023");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("CAN List", () => {
    it("loads", () => {
        // beforeEach has ran...
        cy.get("h1").should("have.text", "CANs");
        cy.get('a[href="/cans/510"]').should("exist");
    });

    it("clicking on a CAN takes you to the detail page", () => {
        // beforeEach has ran...
        const canNumber = "G99XXX4";

        cy.contains(canNumber).click();

        cy.url().should("include", "/cans/510");
        cy.get("h1").should("contain", canNumber);
    });

    it("should correctly filter all cans or my cans", () => {
        cy.get("tbody").children().should("have.length.greaterThan", 2);
        cy.visit("/cans/?filter=my-cans");
        cy.get("#fiscal-year-select").select("2023");
        // table should not exist
        cy.get("tbody").should("not.exist");
    });

    it("the filter button works as expected", () => {
        cy.get("button").contains("Filter").click();

        // set a number of filters
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.get(".can-active-period-combobox__control")
            .click()
            .get(".can-active-period-combobox__menu")
            .find(".can-active-period-combobox__option")
            .first()
            .click();
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.get(".can-transfer-combobox__control")
            .click()
            .get(".can-transfer-combobox__menu")
            .find(".can-transfer-combobox__option")
            .first()
            .click();
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.get(".can-portfolio-combobox__control")
            .click()
            .get(".can-portfolio-combobox__menu")
            .find(".can-portfolio-combobox__option")
            .first()
            .click();
        // budget range is set by default
        // click the button that has text Apply
        cy.get("button").contains("Apply").click();

        // check that the correct tags are displayed
        cy.get("div").contains("Filters Applied:").should("exist");
        cy.get("svg[id='filter-tag-activePeriod']").should("exist");
        cy.get("svg[id='filter-tag-transfer']").should("exist");
        cy.get("svg[id='filter-tag-portfolio']").should("exist");
        cy.get("svg[id='filter-tag-budget']").should("exist");

        cy.get("span").contains("1 Year").should("exist");
        cy.get("span").contains("Direct").should("exist");
        cy.get("span").contains("Child Care (CC)").should("exist");
        cy.get("span").contains("$500,000 to $10,000,000").should("exist");

        // No CANs found
        cy.get("tbody").should("not.exist");
        cy.get("p.text-center").contains("No CANs found").should("exist");
        // reset
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();

        // check that the table is filtered correctly
        // table should have more than 5 rows
        /// check that the correct tags are displayed
        cy.get("div").contains("Filters Applied:").should("not.exist");
        cy.get("svg[id='filter-tag-activePeriod']").should("not.exist");
        cy.get("svg[id='filter-tag-transfer']").should("not.exist");
        cy.get("svg[id='filter-tag-portfolio']").should("not.exist");
        cy.get("svg[id='filter-tag-budget']").should("not.exist");

        cy.get("tbody").find("tr").should("have.length.greaterThan", 3);
    });

    it("pagination on the bli table works as expected", () => {
        cy.get("ul").should("have.class", "usa-pagination__list");
        cy.get("li").should("have.class", "usa-pagination__item").contains("1");
        cy.get("button").should("have.class", "usa-current").contains("1");
        cy.get("li").should("have.class", "usa-pagination__item").contains("2");
        cy.get("li").should("have.class", "usa-pagination__item").contains("Next");
        cy.get("tbody").find("tr").should("have.length", 10);
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
