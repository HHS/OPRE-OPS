/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/budget-lines");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.get("h1").should("have.text", "Budget Lines");
    cy.get("h2").should("have.text", "All Budget Lines");
});

it("budget line items link defaults to all-budget-line-items", () => {
    cy.visit("/");
    cy.get("a").contains("Budget Lines");
    cy.get('a[href="/budget-lines"]').should("exist");
});

it("clicking the add budget lines button takes you to the create budget lines page", () => {
    cy.get("a").contains("Add Budget Lines");
    cy.get('a[href="/budget-lines/create"]').should("exist");
});

it("pagination on the bli table works as expected", () => {
    // initial page load
    cy.get("ul").should("have.class", "usa-pagination__list");
    cy.get("li").should("have.class", "usa-pagination__item").contains("1");
    cy.get("a").should("have.class", "usa-current").contains("1");
    cy.get("li").should("have.class", "usa-pagination__item").contains("2");
    cy.get("li").should("have.class", "usa-pagination__item").contains("Next");
    cy.get("li").should("not.contain", "Previous");
    cy.get("tbody").find("tr").should("have.length", 10);

    // go to the second page
    cy.get("li").should("have.class", "usa-pagination__item").contains("2").click();
    cy.get("a").should("have.class", "usa-current").contains("2");
    cy.get("li").should("have.class", "usa-pagination__item").contains("Previous");
    cy.get("li").should("not.contain", "Next");

    // go back to the first page
    cy.get("li").should("have.class", "usa-pagination__item").contains("1").click();
    cy.get("a").should("have.class", "usa-current").contains("1");
});
