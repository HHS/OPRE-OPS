/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/agreements/create");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("can create a Grant agreement", () => {
    cy.intercept("POST", "**/agreements").as("postAgreement");

    // Step One - Select a Project
    cy.get("#project-combobox-input").type("Human Services Interoperability Support{enter}");
    cy.get("#continue").click();

    // Step Two - Create Agreement
    cy.get("[data-cy='agreement-type']").should("not.exist");
    cy.get("[data-cy='save-draft-btn']").should("be.disabled");

    // Select Grant type
    cy.get("#agreement-type-filter").select("GRANT");

    // Contract-only controls should not be visible
    cy.get("#contract-type").should("not.exist");
    cy.get("#service_requirement_type").should("not.exist");
    cy.get("#product_service_code_id").should("not.exist");
    cy.get("#agreement_reason").should("not.exist");

    // Grant Details fields should be visible
    cy.get("#nofo_number").should("exist");
    cy.get("#funding_period_months").should("exist");
    cy.get("#aln_number").should("exist");
    // The FPO combobox now renders for grants (reuses ProjectOfficerComboBox)
    cy.get("#project-officer-combobox-input").should("exist");

    // Grant Details fields should be visible
    cy.get("#nofo_number").should("exist");
    cy.get("#funding_period_months").should("exist");
    cy.get("#aln_number").should("exist");
    // The FPO combobox now renders for grants (reuses ProjectOfficerComboBox)
    cy.get("#project-officer-combobox-input").should("exist");

    // Continue button should exist but stay disabled for grants until NOFO Number is present
    cy.get("[data-cy='continue-btn']").should("exist").and("be.disabled");

    // Save Draft should still be disabled (no title yet)
    cy.get("[data-cy='save-draft-btn']").should("be.disabled");

    // Enter Title/Nickname/Description (from #5925) — Save Draft still disabled without NOFO Number
    cy.get("#name").type("E2E Grant Agreement Test");
    cy.get("#nickname").type("GRANT-TEST");
    cy.get("#description").type("This is a test grant agreement description.");
    cy.get("[data-cy='save-draft-btn']").should("be.disabled");

    // NOFO Number is now required to enable Save Draft
    cy.get("#nofo_number").type("NOFO-2026-01");

    // Optionally fill the remaining Grant Details fields
    cy.get("#funding_period_months").type("18");
    cy.get("#aln_number").type("93.600");

    // NOFO Number is now required to enable Save Draft and Continue
    cy.get("#nofo_number").type("NOFO-2026-01");

    // Optionally fill the remaining Grant Details fields
    cy.get("#funding_period_months").type("18");
    cy.get("#aln_number").type("93.600");

    // Save Draft and Continue should now be enabled once NOFO Number is present
    cy.get("[data-cy='save-draft-btn']").should("not.be.disabled");
    cy.get("[data-cy='continue-btn']").should("not.be.disabled");

    // Select Project Officer
    cy.get("#project-officer-combobox-input").type("Chris Fortunato{enter}");

    // Continue to Step 3 - Grant Numbers
    cy.get("[data-cy='continue-btn']").click();

    // Services Component controls should not render for grants
    cy.get("#servicesComponentSelect").should("not.exist");

    // Empty state for grant numbers
    cy.get("[data-cy='grant-number-list']").should("contain", "You have not added any Grants Numbers yet.");

    // Add Grant 1
    cy.get("#grantNumberSelect").select("1");
    cy.get("#grant-number-pop-start-date").type("01/01/2026");
    cy.get("#grant-number-pop-end-date").type("12/31/2026");
    cy.get("#description").type("Placeholder grant number for FY26.");
    cy.get("[data-cy='add-grant-number-btn']").click();
    cy.get("[data-cy='Grant 1-grant-number-item-title']").should("contain", "Grant 1");

    // Add Grant 2
    cy.get("#grantNumberSelect").select("2");
    cy.get("#grant-number-pop-start-date").type("01/01/2027");
    cy.get("#grant-number-pop-end-date").type("12/31/2027");
    cy.get("#description").type("Second placeholder grant number.");
    cy.get("[data-cy='add-grant-number-btn']").click();
    cy.get("[data-cy='Grant 2-grant-number-item-title']").should("contain", "Grant 2");

    // Grant 1 and Grant 2 should now be disabled in the select
    cy.get("#grantNumberSelect").within(() => {
        cy.get("option:disabled").should("contain", "Grant 1");
        cy.get("option:disabled").should("contain", "Grant 2");
    });

    // Edit Grant 1's description
    cy.get("[data-cy='grant-number-list'] > :nth-child(1)").trigger("mouseover");
    cy.get("[data-cy='grant-number-list'] > :nth-child(1)").within(() => {
        cy.get("[data-cy='grant-number-item-edit-button']").should("be.visible").click();
    });
    cy.get("#description").clear().type("Updated description for Grant 1.");
    cy.get("[data-cy='update-grant-number-btn']").click();

    // Delete Grant 2
    cy.get("[data-cy='grant-number-list'] > :nth-child(2)").trigger("mouseover");
    cy.get("[data-cy='grant-number-list'] > :nth-child(2)").within(() => {
        cy.get("[data-cy='grant-number-item-delete-button']").should("be.visible").click();
    });
    cy.get('[data-cy="confirm-action"]').click();
    cy.get("[data-cy='Grant 2-grant-number-item-title']").should("not.exist");
    cy.get("[data-cy='Grant 1-grant-number-item-title']").should("exist");

    // Budget Lines section should show the grant-specific empty state (BLIs are #5928)
    cy.get("p").should("contain", "You have not added any Budget Lines yet.");

    // Create the agreement
    cy.get("[data-cy='continue-btn']").click();
    cy.wait("@postAgreement").then((interception) => {
        const { statusCode, body } = interception.response;
        expect(statusCode).to.equal(201);
        expect(interception.request.body.grant_numbers).to.have.length(1);
        expect(interception.request.body.grant_numbers[0]).to.include({ number: 1 });

        const agreementId = body.id;
        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
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

it("can save a Grant agreement draft without adding grant numbers", () => {
    cy.intercept("POST", "**/agreements").as("postAgreement");

    // Step One - Select a Project
    cy.get("#project-combobox-input").type("Human Services Interoperability Support{enter}");
    cy.get("#continue").click();

    // Step Two - Create Agreement
    cy.get("#agreement-type-filter").select("GRANT");
    cy.get("#name").type("E2E Grant Draft Save Test");
    cy.get("#nofo_number").type("NOFO-2026-02");

    // Save the draft directly from Step 2, without ever visiting Step 3
    cy.get("[data-cy='save-draft-btn']").click();
    cy.wait("@postAgreement").then((interception) => {
        const { statusCode, body } = interception.response;
        expect(statusCode).to.equal(201);
        const agreementId = body.id;

        cy.get("[data-cy='alert']").should("contain", "Agreement Draft Saved");
        cy.url().should("include", "/agreements");

        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
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
