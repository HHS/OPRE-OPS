import { testLogin } from "./utils";

before(() => {
    testLogin("admin");
    cy.visit("/research-projects/1");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y();
});

it("loads", () => {
    cy.get("h1").should("contain", "African American Child and Family Research Center");
    cy.get("h2").should("contain", "Division of Child and Family Development");
    cy.get("span").should("contain", "Emily Ball");
    cy.get("div").should("contain", "Survey");
    cy.get("div").should("contain", "Population #1");
});
