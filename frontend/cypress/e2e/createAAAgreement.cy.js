/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

describe("Create an AA agreement", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit("/agreements/create");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("Create minimal AA", () => {
        cy.intercept("POST", "**/agreements").as("postAgreement");

        // Step One - Select a Project
        cy.get("#project-combobox-input").type("Human Services Interoperability Support{enter}");
        cy.get("#continue").click();

        // Step Two - Fill out Agreement details
        // Select Agreement Type
        cy.get("#agreement_type").select("AA");
        cy.get(".usa-error-message").should("not.exist");
        cy.get("[data-cy='continue-btn']").should("be.disabled");
        cy.get("[data-cy='save-draft-btn']").should("be.disabled");

        // Fill in Agreement Title
        cy.get("#name").type("Test Assisted Acquisition Title");
        cy.get(".usa-error-message").should("not.exist");
        cy.get("[data-cy='continue-btn']").should("be.disabled");
        cy.get("[data-cy='save-draft-btn']").should("be.disabled");

        // Select Requesting agency
        cy.get("#requesting-agency").select("Administration for Children and Families (ACF)");
        cy.get("[data-cy='continue-btn']").should("be.disabled");
        cy.get("[data-cy='save-draft-btn']").should("be.disabled");

        // Select Servicing agency
        cy.get("#servicing-agency").select("Another Federal Agency (AFA)");
        cy.get("[data-cy='continue-btn']").should("not.be.disabled");
        cy.get("[data-cy='save-draft-btn']").should("not.be.disabled");

        cy.get("[data-cy='continue-btn']").click();
        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
        cy.wait("@postAgreement").then((interception) => {
            const { statusCode, body } = interception.response;
            expect(statusCode).to.equal(201);
            expect(body.message).to.equal("Agreement created");
            const agreementId = body.id;

            cy.get("h1").should("exist");
            // delete test agreement
            cy.request({
                method: "DELETE",
                url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
                headers: {
                    Authorization: bearer_token,
                    Accept: "application/json"
                }
            }).then((response) => {
                expect(response.status).to.eq(200);
            });
        });
    });
});
