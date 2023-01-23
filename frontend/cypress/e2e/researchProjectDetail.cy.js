before(() => {
    cy.visit("/research-projects/1");
    cy.injectAxe();
});

it("loads", () => {
    cy.get("h1").should("contain", "African American Child and Family Research Center");
    cy.get("h2").should("contain", "Division of Child and Family Development");
    cy.get("span").should("contain", "John Doe");
    cy.get("div").should("contain", "Dec 31, 2021");
    cy.get("div").should("contain", "Survey");
    cy.get("div").should("contain", "Population #1");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});
