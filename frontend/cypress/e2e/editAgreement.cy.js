/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "Test Contract",
    description: "Test Description",
    project_id: 1000,
    product_service_code_id: 1,
    procurement_shop_id: 1,
    incumbent: "Test Vendor",
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
    testLogin("admin");
    cy.visit(`/`);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

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

it("cannot edit an agreement with budget line items obligated", () => {
    cy.visit(`/agreements/7`);
    cy.get("h1").should("have.text", "MIHOPE Check-In");
    cy.get("#edit").should("not.exist");
});

it("cannot navigate to edit an agreement with budget line items obligated from review page", () => {
    cy.visit(`/agreements/review/7`);
    cy.get("dd").first().should("have.text", "Mother and Infant Home Visiting Program Evaluation 2");
    cy.get('[data-cy="edit-agreement-btn"]').should("be.disabled");
});

it("cannot edit an agreement with budget line items in executing", () => {
    cy.visit(`/agreements/2`);
    cy.get("h1").should("have.text", "DIRECT ALLOCATION #2: African American Child and Family Research Center");
    cy.get("#edit").should("not.exist");
});

it("cannot navigate to edit an agreement with budget line items in executing from review page", () => {
    cy.visit(`/agreements/review/2`);
    cy.get("dd").first().should("have.text", "Human Services Interoperability Support");
    cy.get('[data-cy="edit-agreement-btn"]').should("be.disabled");
});

it("can edit budget lines if a team member and project officer", () => {
    cy.visit(`/agreements/1/budget-lines`);
    cy.get("h1").should("have.text", "Contract #1: African American Child and Family Research Center");
    cy.get("#edit").should("exist");
});

it("cannot edit budget lines if a team member and project officer", () => {
    cy.visit(`/agreements/7/budget-lines`);
    cy.get("h1").should("have.text", "MIHOPE Check-In");
    cy.get("#edit").should("not.exist");
});

it("can edit a budget line if it is in PLANNED", () => {
    cy.visit(`/agreements/2/budget-lines`);
    cy.get("h1").should("have.text", "DIRECT ALLOCATION #2: African American Child and Family Research Center");
    cy.get("#edit").should("exist");
    cy.get("#edit").click();
    cy.get("tbody").children().as("table-rows").should("exist");
    // get the first row which is in PLANNED
    cy.get("@table-rows").eq(0).find('[data-cy="expand-row"]').click();
    cy.get(".padding-right-9").find('[data-cy="edit-row"]').should("exist");
});

it("can not edit a budget line if it is in OBLIGATED", () => {
    cy.visit(`/agreements/2/budget-lines`);
    cy.get("h1").should("have.text", "DIRECT ALLOCATION #2: African American Child and Family Research Center");
    cy.get("#edit").should("exist");
    cy.get("#edit").click();
    cy.get("tbody").children().as("table-rows").should("exist");
    // get the second row which is in OBLIGATED
    cy.get("@table-rows").eq(1).find('[data-cy="expand-row"]').click();
    cy.get(".padding-right-9").find('[data-cy="edit-row"]').should("exist");
    cy.get('[data-icon="clone"]').should("exist");
});

it("can not edit a budget line if it is in EXECUTING", () => {
    cy.visit(`/agreements/2/budget-lines`);
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
    cy.visit(`/agreements/1/budget-lines`);
    cy.get("h1").should("have.text", "Contract #1: African American Child and Family Research Center");
    cy.get("#edit").should("exist");
    cy.get("#edit").click();
    cy.get("tbody").children().as("table-rows").should("exist");
    // get the first row which is in DRAFT
    cy.get("@table-rows").eq(0).find('[data-cy="expand-row"]').click();
    cy.get(".padding-right-9").find('[data-cy="edit-row"]').should("exist");
    cy.get('[data-cy="continue-btn"]').should("exist");
    cy.get('[data-cy="continue-btn"]').click();
});

it("should not PATCH an agreement when no changes are made", () => {
    cy.visit(`/agreements/edit/1`);
    // step one
    cy.get("#continue").click();
    // step two and make NO change
    cy.get("#continue").click();
    cy.get("[data-cy='alert']").should("not.exist");
});
