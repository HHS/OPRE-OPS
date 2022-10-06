before(() => {
    cy.visit("/portfolios/1");
    cy.injectAxe();
});

it("loads", () => {
    cy.get("h1").should("contain", "SuperAwesome Portfolio");
    cy.get("h2").should("contain", "Portfolio description");
    cy.get("h3").should("contain", "Funding Summary");
    cy.get("h3").should("contain", "Total Funding");
    cy.get("h4").should("contain", "Fiscal Year");
    cy.get("h3").should("contain", "$");
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
