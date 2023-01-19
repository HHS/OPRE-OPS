before(() => {
    cy.visit("/portfolios/1");
    cy.injectAxe();
});

it("loads", () => {
    cy.get("h1").should("contain", "Child Welfare Research");
    cy.get("h2").should("contain", "Division of Child and Family Development");
    cy.get("h3").should("contain", "Team Leaders");
    cy.get("a").should("contain", "Emily Ball");
    cy.get("p").should("contain", "The promotion of children’s safety, permanence, and well-being");
    cy.get("a").should("contain", "Budget And Funding");
    cy.get("a").should("contain", "Research Projects");
    cy.get("a").should("contain", "People and Teams");
    cy.get("h2").should("contain", "Portfolio Budget Summary");
    cy.get("h3").should("contain", "Total Budget");
    cy.get("h3").should("contain", "New Funding");
    cy.get("h3").should("contain", "Previous FYs Carry-Forward");
    cy.get("h3").should("contain", "Budget Status");
    cy.get("h3").should("contain", "Portfolio CANs");
    cy.get("option").should("contain", "2022");
    cy.get("option").should("contain", "2023");
    cy.get("#portfolioCANChart").should("be.visible");
    cy.get("#portfolioBudgetStatusChart").should("be.visible");
    cy.get(".usa-select").should("be.visible");
    cy.get("span").should("contain", "$");
});

it("loads the Poftfolio Budget Details component", () => {
    cy.get("h2").should("contain", "Portfolio Budget Details by CAN");
    cy.get("section").should("contain", "G99IA14");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});

it("expands the description when one clicks read more", () => {
    cy.contains("read more").click();
    cy.get("a").should("contain", "See more on the website");
    cy.checkA11y();
});
