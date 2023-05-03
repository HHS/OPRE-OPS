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

it("can create a project", () => {
    cy.get("#project-type-select-options").select("Research");
    cy.get("#project-abbr").type("Test Project Abbreviation");
    cy.get("#project-name").type("Test Project Name");
    cy.get("#project-description").type("Test Project Description");
    cy.get("#submit").click();
    cy.get(".usa-alert__body").should("contain", "The project has been successfully created.");
});
