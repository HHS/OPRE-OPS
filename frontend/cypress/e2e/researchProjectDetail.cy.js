before(() => {
    cy.fakeLogin();
    cy.visit("/research-projects/1");
    cy.injectAxe();
});

it("loads", () => {
    cy.fakeLogin();
    cy.get("h1").should("contain", "African American Child and Family Research Center");
    cy.get("h2").should("contain", "Division of Child and Family Development");
    cy.get("span").should("contain", "Chris Fortunato");
    cy.get("div").should("contain", "Survey");
    cy.get("div").should("contain", "Population #1");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});
