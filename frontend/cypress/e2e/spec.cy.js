/* eslint-disable no-undef */

it("get can details", () => {
    cy.visit("/cans");
    cy.injectAxe();

    cy.checkA11y();

    cy.contains("G99PHS9").click();
    cy.url().should("include", "/cans/3");
});

it("get can fiscal year details", () => {
    cy.visit("/cans/3");
    cy.injectAxe();

    cy.checkA11y();

    cy.contains("G99PHS9").click();
    cy.get("[class*='-control']")
        .click(0, 0, { force: true })
        .get("[class*='-menu']")
        .find("[id*='-option']")
        .eq(2)
        .click(0, 0, { force: true });
    cy.contains("7512000");
});

it("get a negative value", () => {
    cy.visit("/cans/3");
    cy.contains("G99PHS9").click();
    cy.get("[class*='-control']")
        .click(0, 0, { force: true })
        .get("[class*='-menu']")
        .find("[id*='-option']")
        .eq(3)
        .click(0, 0, { force: true });
    cy.contains("-300000");
    cy.get("[class*='redNegative']").contains("-300000");
});
