/* eslint-disable no-undef */

it("loads", () => {
    cy.visit("/cans/3");

    cy.get("h1").should("contain", "G99PHS9");
});

it("passes a11y checks", () => {
    cy.visit("/cans/3");
    cy.injectAxe();

    cy.checkA11y();
});

it("get can fiscal year details", () => {
    cy.visit("/cans/3");

    clickOnFiscalYearOption(2);
    cy.contains("7512000");
});

it("get a negative value", () => {
    cy.visit("/cans/3");

    clickOnFiscalYearOption(3);
    cy.contains("-300000");
    cy.get("[class*='redNegative']").contains("-300000");
});

const clickOnFiscalYearOption = (optionIndex) => {
    cy.get("[class*='-control']")
        .click(0, 0, { force: true })
        .get("[class*='-menu']")
        .find("[id*='-option']")
        .eq(optionIndex)
        .click(0, 0, { force: true });
};
