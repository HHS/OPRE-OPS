before(() => {
    cy.fakeLogin();
    cy.visit("/portfolios");
    cy.injectAxe();
});

it("loads", () => {
    cy.fakeLogin();
    cy.get("h1").should("have.text", "Portfolios");
    cy.get('a[href="/portfolios/1"]').should("exist");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});

it("clicking on a Portfolio takes you to the detail page", () => {
    cy.fakeLogin();
    const portfolioName = "Healthy Marriage & Responsible Fatherhood";

    cy.contains(portfolioName).click();

    cy.url().should("include", "/portfolios/6");
    cy.get("h1").should("contain", portfolioName);
});
