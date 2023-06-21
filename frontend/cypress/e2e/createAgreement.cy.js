/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/agreements/create");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.get("h2").should("contain", "Select a Project");
});

it("project type select has some projects", () => {
    cy.get("#project--list").children().should("contain", "Human Services Interoperability Support");
    cy.get("#project--list").children().should("contain", "Youth Demonstration Development Project");
    cy.get("#project--list").children().should("contain", "Annual Performance Plans and Reports");
});

it("can create an agreement", () => {
    cy.intercept("POST", "**/agreements").as("postAgreement");

    // Step One - Select a Project
    cy.get("#project--list--toggle").click();
    cy.get("#project--list").invoke("show");
    cy.get("li").contains("Human Services Interoperability Support").click();
    cy.get("#continue").click();

    // Step Two - Create an Agreement
    // test for rendered ProjectSummaryCard
    cy.get("dt").should("contain", "Project");
    cy.get("dd").should("contain", "Human Services Interoperability Support");
    // test validation
    cy.get("#agreement-type-options").select("CONTRACT");
    cy.get("#agreement-title").type("Test Agreement Title");
    cy.get("#agreement-title").clear();
    cy.get("#agreement-title").blur();
    cy.get("#input-error-message").should("contain", "This is required information");
    cy.get("[data-cy='continue-btn']").should("be.disabled");
    cy.get("[data-cy='save-draft-btn']").should("be.disabled");
    cy.get("#agreement-title").type("Test Agreement Title");
    cy.get("#input-error-message").should("not.exist");
    cy.get("[data-cy='continue-btn']").should("not.be.disabled");
    cy.get("[data-cy='save-draft-btn']").should("not.be.disabled");

    cy.get("#agreement-description").type("Test Agreement Description");
    cy.get("#product-service-code-options").select("Other Scientific and Technical Consulting Services");
    cy.get("#procurement-shop-select").select("Product Service Center (PSC)");
    cy.get("#procurement-shop-select").select("Product Service Center (PSC)");
    cy.get("#reason-for-agreement-select").select("NEW_REQ");

    // Select Project Officer
    cy.get("#project-officer-select-toggle-list").click();
    cy.get("#project-officer-select").invoke("show");
    cy.get("#users--list").invoke("show");
    cy.get("li").contains("Chris Fortunato").click();

    // Skip Select Team Members for now - something is wrong with the select
    cy.get("#with-hint-textarea").type("This is a note.");
    cy.get("[data-cy='continue-btn']").click();

    // Add a new budget line item
    cy.get("#bl-description").type("Test BLI Description");
    cy.get("#procurement_month").select("01 - Jan");
    cy.get("#procurement_day").type("1");
    cy.get("#procurement_year").type("2024");
    cy.get("#can-select").type("G99MVT3");
    cy.get("#bl-amount").type("1000000");
    cy.get("#with-hint-textarea").type("Something something note something.");
    cy.get("#add-budget-line").click();

    // Duplicate budget line item
    cy.get("[id^=expand-]").click();
    cy.get("[id^=duplicate-]").click();

    // expand budget line and check that the "created by" name is not empty.
    cy.get("[id^=expand-]").each((_, element) => {
        const item = Cypress.$(element);
        const id = item.attr("id");
        if (id !== undefined) {
            const index = id.split("-")[1];
            item.click();

            cy.get(`#created-by-name-${index}`, { timeout: 15000 })
                .invoke("text")
                .then((text) => {
                    expect(text.length).to.be.at.least(1);
                });
        }
    });

    cy.wait("@postAgreement")
        .then((interception) => {
            const { statusCode, body } = interception.response;
            expect(statusCode).to.equal(201);
            expect(body.message).to.equal("Agreement created");
        })
        .then(cy.log);
    cy.get("h1").should("exist");
});

it("should handle cancelling out of workflow on step 1", () => {
    cy.get("#project--list--toggle").click();
    cy.get("#project--list").invoke("show");
    cy.get("li").contains("Human Services Interoperability Support").click();
    // cancel out of workflow
    cy.get('[data-cy="cancel-button"]').click();
    cy.get('[data-cy="confirm-action"]').click();
    // check that we are back on the home page
    cy.url().should("eq", Cypress.config().baseUrl + "/");
    cy.get("h1").should("exist");
});

it("should handle cancelling out of workflow on step 2", () => {
    // Step One - Select a Project
    cy.get("#project--list--toggle").click();
    cy.get("#project--list").invoke("show");
    cy.get("li").contains("Human Services Interoperability Support").click();
    cy.get("#continue").click();
    // Step Two - Create an Agreement
    cy.get("dt").should("contain", "Project");
    cy.get("dd").should("contain", "Human Services Interoperability Support");
    cy.get("#agreement-type-options").select("CONTRACT");
    cy.get("#agreement-title").type("Test Agreement Title");
    cy.get("#agreement-description").type("Test Agreement Description");
    cy.get("#product-service-code-options").select("Other Scientific and Technical Consulting Services");
    cy.get("#procurement-shop-select").select("Product Service Center (PSC)");
    cy.get("#reason-for-agreement-select").select("NEW_REQ");
    // cancel out of workflow
    cy.get('[data-cy="cancel-button"]').click();
    cy.get('[data-cy="confirm-action"]').click();
    // check that we are back on the agreements page
    cy.url().should("eq", Cypress.config().baseUrl + "/agreements");
    cy.get("h1").should("exist");
});
