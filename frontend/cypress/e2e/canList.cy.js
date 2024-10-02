/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("division-director");
    cy.visit("/cans").wait(1000);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("CAN List", () => {
    it("loads", () => {
        // beforeEach has ran...
        cy.get("h1").should("have.text", "CANs");
        cy.get('a[href="/cans/502"]').should("exist");
    });

    it("clicking on a CAN takes you to the detail page", () => {
        // beforeEach has ran...
        const canNumber = "G99PHS9";

        cy.contains(canNumber).click();

        cy.url().should("include", "/cans/502");
        cy.get("h1").should("contain", canNumber);
    });

    it("should correctly filter all cans or my cans", () => {
        cy.visit("/cans/");
        cy.get("tbody").children().should("have.length.greaterThan", 2);

        cy.visit("/cans/?filter=my-cans");
        cy.get("tbody").children().should("have.length", 1);
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
