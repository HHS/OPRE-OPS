/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
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
    cy.get('[data-cy="project-type-select"]').should("contain", "Research");
});

it("can create a project", () => {
    cy.intercept("POST", "**/research-projects").as("postProject");
    // default state
    cy.get("#submit").should("be.disabled");
    // select the project type
    cy.get('[data-cy="project-type-select"]').select("Research");
    // only allow 3 characters so this should fail
    cy.get("#short_title").as("nickname").type("Test Project Abbreviation");
    cy.get(".usa-error-message").as("err-msg").should("exist");
    // clear the input and try again
    cy.get("@nickname").clear();
    cy.get("@nickname").type("TPN");
    cy.get("@err-msg").should("not.exist");
    // type and then clear to test validation
    cy.get("#title").type("Test Project Name");
    cy.get("#title").clear();
    cy.get("@err-msg").should("exist");
    // type and then clear to test validation
    cy.get("#title").type("Test Project Name");
    // type and then clear to test validation
    cy.get("#description").type("Test Project Description");
    cy.get("#description").clear();
    cy.get("@err-msg").should("exist");
    // type and then clear to test validation
    cy.get("#description").type("Test Project Description");
    // submit the form
    cy.get("#submit").should("not.be.disabled");
    cy.get("#submit").click();

    cy.wait("@postProject")
        .then((interception) => {
            const { statusCode, body } = interception.response;
            expect(statusCode).to.equal(201);
            expect(body.short_title).to.equal("TPN");
            expect(body.title).to.equal("Test Project Name");
            expect(body.description).to.equal("Test Project Description");
        })
        .then(cy.log);
    cy.get(".usa-alert__body").should("contain", "The project has been successfully created.");
});

it("can cancel a project", () => {
    // complete the form
    cy.get('[data-cy="project-type-select"]').select("Research");
    cy.get("#short_title").type("TPN");
    cy.get("#title").type("Test Project Name");
    cy.get("#description").type("Test Project Description");
    // cancel the form
    cy.get("#cancel").click();
    cy.get(".usa-modal").should("contain", "Are you sure you want to cancel?");
});
