before(() => {
    cy.visit("/portfolios/1");
    cy.injectAxe();
});

it("loads", () => {
    cy.get("h1").should("contain", "Child Welfare Research");
    cy.get("h2").should("contain", "Division of Child and Family Development");
    cy.get("p").should("contain", "The promotion of children’s safety, permanence, and well-being");
    cy.get("h2").should("contain", "Portfolio Budget Summary");
    cy.get("h3").should("contain", "Total Budget");
    cy.get("span").should("contain", "$");
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

it("expands the description when one clicks read more", () => {
    cy.contains("read more").click();
    cy.get("a").should("contain", "See more on the website");
    cy.checkA11y();
});
