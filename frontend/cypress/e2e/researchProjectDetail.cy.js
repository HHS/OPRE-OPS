before(() => {
    cy.visit("/research-projects/1");
    cy.injectAxe();
});

it("loads", () => {
    cy.get("h1").should("contain", "Research Project");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});
