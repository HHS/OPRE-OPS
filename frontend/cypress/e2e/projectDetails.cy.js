/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Project Details Page", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit("/projects/1000");
        cy.get("h1", { timeout: 10000 }).should("be.visible");
    });

    it("loads the seeded project details and disabled tab tooltips", () => {
        cy.url().should("include", "/projects/1000");
        cy.get("h1").should("contain", "Human Services Interoperability Support");
        cy.contains("h2", "Project Details").should("be.visible");

        cy.get("[data-cy='project-tab-Project Details']").should("be.visible");
        cy.get("[data-cy='project-tab-Project Spending']").should("be.visible").and("not.be.disabled");
        cy.get("[data-cy='project-tab-Project Funding']").should("be.visible").and("not.be.disabled");

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
        cy.contains("h2", "Edit Project").should("be.visible");
        cy.get("input[name='title']").should("be.visible");
        cy.get("input[name='short_title']").should("be.visible");
        cy.get("textarea[name='description']").should("be.visible");
        cy.get("[data-cy='save-btn']").should("be.visible");
        cy.get("[data-cy='cancel-button']").should("be.visible");
    });

    it("edits project details and saves successfully", () => {
        const originalShortTitle = "HSS";
        const updatedShortTitle = `HSS-${Date.now()}`;
        cy.intercept("PATCH", "**/api/v1/projects/1000").as("patchProject");

        cy.get("[data-cy='project-details-edit-button']").click();
        cy.get("input[name='short_title']").clear().type(updatedShortTitle);
        cy.get("[data-cy='save-btn']").click();

        cy.wait("@patchProject").then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            expect(interception.response.body.id).to.equal(1000);
        });
        cy.contains("Project Updated").should("be.visible");
        cy.get("[data-cy='project-nickname-tag']").should("contain", updatedShortTitle);

        cy.get("[data-cy='project-history-container']").should("be.visible");
        cy.get("[data-cy='project-history-list']").within(() => {
            cy.get("[data-cy='log-item-title']").first().should("contain", "Project Nickname");
            cy.get("[data-cy='log-item-message']").first().should("contain", updatedShortTitle);
        });

        // Restore the seeded short_title so later tests (and the seeded fixture assertions
        // above) keep passing when the spec reruns against the same database.
        cy.get("[data-cy='project-details-edit-button']").click();
        cy.get("input[name='short_title']").clear().type(originalShortTitle);
        cy.get("[data-cy='save-btn']").click();
        cy.wait("@patchProject").its("response.statusCode").should("equal", 200);
    });

    it("shows an error alert when the save request fails", () => {
        cy.intercept("PATCH", "**/api/v1/projects/1000", { statusCode: 500, body: { error: "boom" } }).as(
            "patchProjectError"
        );
        cy.get("[data-cy='project-details-edit-button']").click();
        cy.get("input[name='short_title']").clear().type("Will Not Save");
        cy.get("[data-cy='save-btn']").click();
        cy.wait("@patchProjectError");
        cy.contains("Error Updating Project").should("be.visible");
    });

    it("shows confirmation modal on cancel during edit", () => {
        cy.get("[data-cy='project-details-edit-button']").click();
        cy.get("[data-cy='cancel-button']").click();
        cy.contains("Are you sure you want to cancel editing").should("be.visible");
    });
});

describe("Project Details Page — unauthorized user", () => {
    beforeEach(() => {
        testLogin("basic");
        cy.visit("/projects/1000");
        cy.get("h1", { timeout: 10000 }).should("be.visible");
    });

    it("disables the edit button when the user does not have permission", () => {
        cy.get("[data-cy='project-details-edit-button']").should("have.attr", "aria-disabled", "true");
        cy.get("[data-cy='project-details-edit-button']").should(
            "have.attr",
            "aria-label",
            "You do not have permission to edit this project"
        );
    });
});
