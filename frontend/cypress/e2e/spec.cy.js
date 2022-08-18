/* eslint-disable no-undef */
it("list cans", () => {
    cy.visit("/");
    cy.contains("/cans").click();
    cy.url().should("include", "/cans");
});

it("get can details", () => {
    cy.visit("/cans");
    cy.contains("G99PHS9").click();
    cy.url().should("include", "/cans/3");
});

it("get can fiscal year details", () => {
    cy.visit("/cans/3");
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
    cy.get("[class='red-negative']").contains("-300000");
});
