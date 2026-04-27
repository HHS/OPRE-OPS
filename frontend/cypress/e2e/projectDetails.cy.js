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
        cy.get("[data-cy='project-tab-Project Spending']").should("be.visible").and("not.be.disabled");
        cy.get("[data-cy='project-tab-Project Funding']").should("be.disabled").and("have.attr", "data-position", "top");
        cy.get("[role='tooltip']").should("contain", "Coming Soon");

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
});
