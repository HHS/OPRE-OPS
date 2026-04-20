/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/projects/1000");
    cy.get("h1", { timeout: 10000 }).should("be.visible");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Project Details Page", () => {
    it("loads the seeded project details and disabled tab tooltips", () => {
        cy.url().should("include", "/projects/1000");
        cy.get("h1").should("contain", "Human Services Interoperability Support");
        cy.contains("h2", "Project Details").should("be.visible");

        cy.get("[data-cy='project-tab-Project Details']").should("be.visible");
        cy.get("[data-cy='project-tab-Project Spending']")
            .should("be.disabled")
            .and("have.attr", "data-position", "top");
        cy.get("[data-cy='project-tab-Project Funding']")
            .should("be.disabled")
            .and("have.attr", "data-position", "top");

        cy.contains("Description").should("be.visible");
        cy.contains("Project Nickname").should("be.visible");
        cy.contains("Project Type").should("be.visible");
        cy.contains("Research Methodologies").should("be.visible");
        cy.contains("Special Topics").should("be.visible");
        cy.contains("Division Director(s)").should("be.visible");
        cy.contains("Team Leader(s)").should("be.visible");
        cy.contains("COR").should("be.visible");
        cy.contains("Alternate COR").should("be.visible");
        cy.contains("Team Members").should("be.visible");

        cy.get("[data-cy='project-type-tag']").should("contain", "Research");
        cy.get("[data-cy='project-methodologies-tag']").should("contain", "Descriptive Study");
        cy.get("[data-cy='project-division-directors-tag']").should("contain", "Dave Director");
        cy.get("[data-cy='project-team-leaders-tag']").should("contain", "Chris Fortunato");
        cy.get("[data-cy='project-officers-tag']").should("contain", "Chris Fortunato");
        cy.get("[data-cy='alternate-project-officers-tag']").should("contain", "Dave Director");
        cy.get("[data-cy='project-team-members-tag']").should("contain", "Amelia Popham");
    });

    it("enters edit mode and displays the form", () => {
        cy.get("[data-cy='project-details-edit-button']").click();
        cy.contains("h2", "Edit Project Details").should("be.visible");
        cy.get("input[name='title']").should("be.visible");
        cy.get("input[name='short_title']").should("be.visible");
        cy.get("textarea[name='description']").should("be.visible");
        cy.get("[data-cy='save-btn']").should("be.visible");
        cy.get("[data-cy='cancel-button']").should("be.visible");
    });

    it.skip("edits project details and saves successfully", () => {
        cy.get("[data-cy='project-details-edit-button']").click();
        cy.get("input[name='short_title']").clear().type("Updated HSS");
        cy.get("[data-cy='save-btn']").click();
        cy.contains("Project Updated").should("be.visible");
    });

    it("shows confirmation modal on cancel during edit", () => {
        cy.get("[data-cy='project-details-edit-button']").click();
        cy.get("[data-cy='cancel-button']").click();
        cy.contains("Are you sure you want to cancel editing").should("be.visible");
    });
});
