/* eslint-disable no-undef */
test("List CANs", () => {
    it("passes", () => {
        cy.visit("/");
        cy.contains("/cans").click();
        cy.url().should("include", "/cans");
    });
});

test("CAN Details", () => {
    it("passes", () => {
        cy.visit("/cans");
        cy.contains("G99PHS9").click();
        cy.url().should("include", "/cans/3");
    });
});

test("Select Fiscal Year", () => {
    it("passes", () => {
        cy.visit("/cans/3");
        cy.contains("G99PHS9").click();
    });
});
