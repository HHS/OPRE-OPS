/* eslint-disable no-undef */
describe("List CANs", () => {
    it("passes", () => {
        cy.visit("http://localhost:3000/");
        cy.contains("/cans").click();
        cy.url().should("include", "/cans");
    });
});

describe("CAN Details", () => {
    it("passes", () => {
        cy.visit("http://localhost:3000/cans");
        cy.contains("G99PHS9").click();
        cy.url().should("include", "/cans/3");
    });
});

describe("Select Fiscal Year", () => {
    it("passes", () => {
        cy.visit("http://localhost:3000/cans/3");
        cy.contains("G99PHS9").click();
        cy.url().should("include", "/cans/3");
    });
});
