/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

let testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Edit Agreement Test",
    description: "Test Description",
    service_requirement_type: "NON_SEVERABLE",
    project_id: 1000,
    product_service_code_id: 1,
    awarding_entity_id: 2,
    vendor: "Test Vendor",
    project_officer_id: 500,
    team_members: [
        {
            id: 502
        },
        {
            id: 504
        }
    ],
    notes: "Test Notes"
};

beforeEach(() => {
    // append a unique identifier to the agreement name to avoid conflicts
    const uniqueId = Date.now();
    testAgreement.name = `E2E Edit Agreement Test ${uniqueId}`;

    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Not awarded Agreement", () => {
    it("edit an agreement", () => {
        expect(localStorage.getItem("access_token")).to.exist;

        // create test agreement
        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
        cy.request({
            method: "POST",
            url: "http://localhost:8080/api/v1/agreements/",
            body: testAgreement,
            headers: {
                Authorization: bearer_token,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
            const agreementId = response.body.id;

            cy.intercept("PATCH", "**/agreements/**").as("patchAgreement");
            cy.visit(`/agreements/edit/${agreementId}?mode=edit`);
            cy.get("[data-cy='page-heading']").should("have.text", "Edit Agreement");
            cy.get("#budget-lines-header").should("not.exist");
            cy.get("#continue").click();
            // test validation
            cy.get("#name").clear();
            cy.get("#name").blur();
            cy.get(".usa-error-message").should("contain", "This is required information");
            cy.get("[data-cy='continue-btn']").should("be.disabled");
            cy.get("[data-cy='save-draft-btn']").should("be.disabled");
            cy.get("#name").type("Test Edit Title");
            cy.get(".usa-error-message").should("not.exist");
            cy.get("[data-cy='continue-btn']").should("not.be.disabled");
            cy.get("[data-cy='save-draft-btn']").should("not.be.disabled");
            cy.get("#description").type(" more text");
            cy.get("#agreementNotes").type("test edit notes");

            cy.get("[data-cy='continue-btn']").click();

            cy.wait("@patchAgreement")
                .then((interception) => {
                    const { statusCode, body } = interception.response;
                    expect(statusCode).to.equal(200);
                    expect(body.message).to.equal("Agreement updated");
                })
                .then(cy.log);

            cy.get("[data-cy='page-heading']").should("have.text", "Edit Agreement");
            cy.get("h2").first().should("have.text", "Create Services Components");

            cy.get('[data-cy="continue-btn"]').click();
            // get Alert role status
            cy.get("[data-cy='alert']").find("h1").should("have.text", "Agreement Created");
            cy.get("h1").should("exist");

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

    it("cannot edit an agreement with type Direct Obligation", () => {
        cy.visit(`/agreements/2`);
        closeNonContractAccordion();
        cy.get("h1").should("have.text", "DIRECT ALLOCATION #2: African American Child and Family Research Center");
        cy.get("#edit").should("not.exist");
    });

    it("can edit budget lines if a team member and project officer", () => {
        cy.visit(`/agreements/7/budget-lines`);
        cy.get("h1").should("have.text", "MIHOPE Check-In");
        cy.get("#edit").should("exist");
    });

    it("can not edit an agreement that's procurement shop is NOT GCS", () => {
        cy.visit(`/agreements/2/budget-lines`);
        closeNonContractAccordion();
        cy.get("h1").should("have.text", "DIRECT ALLOCATION #2: African American Child and Family Research Center");
        cy.get("#edit").should("not.exist"); // not GCS
        cy.get("tbody").children().as("table-rows").should("exist");
        // get the first row which is in PLANNED
        cy.get("@table-rows").eq(0).find('[data-cy="expand-row"]').click();
        cy.get('[data-cy="bli-continue-btn-disabled"]').should("exist");
    });

    //NOTE: This test is failing because the procurement shop is not-GCS
    it.skip("can not edit a budget line if it is in OBLIGATED", () => {
        cy.visit(`/agreements/2/budget-lines`);
        closeNonContractAccordion();
        cy.get("h1").should("have.text", "DIRECT ALLOCATION #2: African American Child and Family Research Center");
        cy.get("#edit").should("exist");
        cy.get("#edit").click();
        cy.get("tbody").children().as("table-rows").should("exist");
        // get the second row which is in OBLIGATED
        cy.get("@table-rows").eq(1).find('[data-cy="expand-row"]').click();
        cy.get(".padding-right-9").find('[data-cy="edit-row"]').should("exist");
        cy.get('[data-icon="clone"]').should("exist");
    });
    //NOTE: This test is failing because the procurement shop is not-GCS
    it.skip("can not edit a budget line if it is in EXECUTING", () => {
        cy.visit(`/agreements/2/budget-lines`);
        closeNonContractAccordion();
        cy.get("h1").should("have.text", "DIRECT ALLOCATION #2: African American Child and Family Research Center");
        cy.get("#edit").should("exist");
        cy.get("#edit").click();
        cy.get("tbody").children().as("table-rows").should("exist");
        // get the fourth row which is in EXECUTION
        cy.get("@table-rows").eq(3).find('[data-cy="expand-row"]').click();
        cy.get(".padding-right-9").find('[data-cy="edit-row"]').should("exist");
        cy.get('[data-icon="clone"]').should("exist");
    });

    it("can edit a budget line if it is in DRAFT", () => {
        cy.visit(`/agreements/10/budget-lines`);
        // Wait for page to load
        cy.get("h1", { timeout: 10000 }).should("have.text", "Contract Workflow Test");
        cy.get("#edit").should("exist");
        cy.get("#edit").click();
        // Wait for edit mode
        cy.waitForEditingState(true);
        cy.get("tbody").children().as("table-rows").should("exist");
        // get the first row which is in DRAFT
        cy.get("@table-rows").eq(0).find('[data-cy="expand-row"]').click();
        cy.get(".padding-right-9").find('[data-cy="edit-row"]').should("exist");
        cy.get('[data-cy="continue-btn"]').should("exist");
        cy.get('[data-cy="continue-btn"]').click();
    });

    it("should not PATCH an agreement when no changes are made", () => {
        cy.visit(`/agreements/edit/9`);
        // step one
        cy.get("#continue").click();
        // step two and make NO change
        cy.get("#continue").click();
        cy.get("[data-cy='alert']").should("not.exist");
    });
});

const closeNonContractAccordion = () => {
    cy.get(".usa-alert__body")
        .eq(1)
        .should("contain", "This page is in progress")
        .and(
            "contain",
            "Agreements that are grants, other partner agreements (IAAs, IPAs, IDDAs), or direct obligations have not been developed yet, but are coming soon."
        );
    // click on close button data-cy=close-alert
    cy.get("[data-cy='close-alert']").eq(0).click();
};
