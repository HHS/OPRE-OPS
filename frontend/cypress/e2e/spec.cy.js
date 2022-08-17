/* eslint-disable no-undef */
describe("List CANs", () => {
    it("list cans", () => {
        cy.visit("/");
        cy.contains("/cans").click();
        cy.url().should("include", "/cans");
    });
});

describe("CAN Details", () => {
    it("get can details", () => {
        cy.visit("/cans");
        cy.contains("G99PHS9").click();
        cy.url().should("include", "/cans/3");
    });
});

describe("Select Fiscal Year", () => {
    it("get can fiscal year details", () => {
        cy.visit("/cans/3");
        cy.contains("G99PHS9").click();
        cy.wait(100);
        cy.get("[class*='-control']")
            .click(0, 0, { force: true })
            .get("[class*='-menu']")
            .find("[id*='-option']")
            .eq(2)
            .click(0, 0, { force: true });
        cy.contains("7512000");
    });
});

describe("Test Negative Value", () => {
    it("get a negative value", () => {
        cy.visit("/cans/3");
        cy.contains("G99PHS9").click();
        cy.wait(100);
        cy.get("[class*='-control']")
            .click(0, 0, { force: true })
            .get("[class*='-menu']")
            .find("[id*='-option']")
            .eq(3)
            .click(0, 0, { force: true });
        cy.contains("-300000");
        cy.get("[class='red-negative']").contains("-300000");
    });
});
