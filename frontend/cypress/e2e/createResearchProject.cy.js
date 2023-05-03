import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/projects/create");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.get("h1").should("contain", "Create New Project");
    cy.get("h2").should("contain", "Select the Project Type");
});

it("project type select has the correct options", () => {
    cy.get("#project-type-select-options").should("contain", "Research");
});
