before(() => {
    cy.visit("/portfolios/1");
    cy.injectAxe();
});

it("loads", () => {
    cy.get("h1").should("contain", "SuperAwesome Portfolio");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});

it("goes to the CAN detail page after clicking on it", () => {
    const canNumber = "G99PHS9";

    cy.contains(canNumber).click();

    cy.url().should("include", "/cans/3");
    cy.get("h1").should("contain", canNumber);
});
