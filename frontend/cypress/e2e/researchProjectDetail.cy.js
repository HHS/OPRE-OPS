before(() => {
    cy.visit("/research-projects/1");
    cy.injectAxe();
});

// it("loads", () => {
//
// });

it("passes a11y checks", () => {
    cy.checkA11y();
});

// it("expands the description when one clicks read more", () => {
//     cy.contains("read more").click();
//     cy.get("a").should("contain", "See more on the website");
//     cy.checkA11y();
// });
