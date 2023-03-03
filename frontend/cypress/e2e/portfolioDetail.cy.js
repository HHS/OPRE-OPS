before(() => {
    cy.visit("/");
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.visit("/portfolios/1");
    cy.injectAxe();
});

it("loads", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.visit("/portfolios/1");
    cy.get("h1").should("contain", "Child Welfare Research");
    cy.get("h2").should("contain", "Division of Child and Family Development");
    cy.get("h3").should("contain", "Team Leaders");
    cy.get("a").should("contain", "Emily Ball");
    cy.get("p").should("contain", "The promotion of children’s safety, permanence, and well-being");
    cy.get("a").should("contain", "Budget and Funding");
    cy.get("a").should("contain", "Projects and Spending");
    cy.get("a").should("contain", "People and Teams");
    cy.get("h2").should("contain", "Portfolio Budget Summary");
    cy.get("h3").should("contain", "Budget");
    cy.get("h3").should("contain", "Budget Status");
    cy.get("option").should("contain", "2022");
    cy.get("option").should("contain", "2023");
    // add  two for  new  charts summary
    cy.get("#currency-summary-card").should("be.visible");
    cy.get("#portfolioBudgetStatusChart").should("be.visible");
    cy.get(".usa-select").should("be.visible");
    cy.get("span").should("contain", "$");
});

it("passes a11y checks", () => {

    cy.injectAxe();
    cy.checkA11y();
});

it("loads the Poftfolio Budget Details component", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.get("h2").should("contain", "Portfolio Budget Details by CAN");
    cy.get("section").should("contain", "G99IA14");
});

it("expands the description when one clicks read more", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.contains("read more").click();
    cy.get("a").should("contain", "See more on the website");
});

it("loads the Poftfolio Budget Details component", () => {
    cy.fakeLogin();
    cy.get("h2").should("contain", "Portfolio Budget Details by CAN");
    cy.get("section").should("contain", "G99IA14");
});

it("shows the Portfolio Projects and Spending tab", () => {
    cy.visit("/portfolios/1/research-projects/");
    // summary cards
    cy.get("h2").should("contain", "Projects & Spending Summary");
    cy.get("h3").should("contain", "FY 2023 Budget vs Spending");
    cy.get("h3").should("contain", "FY 2023 Projects");
    cy.get("h3").should("contain", "FY 2023 Agreements");
    // tables
    cy.get("h2").should("contain", "Research Projects");
    cy.get("h2").should("contain", "Administrative & Support Projects");
});
