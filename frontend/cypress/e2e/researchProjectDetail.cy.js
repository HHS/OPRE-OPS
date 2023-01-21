before(() => {
    cy.visit("/research-projects/1");
    cy.injectAxe();
});

it("loads", () => {
    cy.get("h1").should("contain", "African American Child and Family Research Center");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});
