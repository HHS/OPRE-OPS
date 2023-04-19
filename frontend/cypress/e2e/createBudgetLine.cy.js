import { testLogin } from "./utils";

before(() => {
    testLogin("admin");
    cy.visit("/budget-lines/create");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y();
});

it("loads", () => {
    cy.get("h1").should("contain", "Create New Budget Line");
});

it("selects a project", () => {
    cy.get('select[name="project"]').select("Human Services Interoperability Support");
    cy.get('select[name="project"]').should("have.value", "1");
});
