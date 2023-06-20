import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.visit("/cans/3/");
    cy.get("h1").should("contain", "G99PHS9");
});

it("get can fiscal year details - skip while the UI is being updated and data changes", () => {
    clickOnFiscalYearOption("2022");
    cy.contains("7000000");
});

it.skip("get a negative value - skip for now because we are working on requirements for how to calculate total/pending/funded/etc", () => {
    clickOnFiscalYearOption("2023");
    cy.contains("-300000");
    cy.get("[class*='redNegative']").contains("-300000");
});

const clickOnFiscalYearOption = (year) => {
    cy.visit("/cans/3/");
    cy.get("[class*='fiscalYearSelector']").select(year);
};
