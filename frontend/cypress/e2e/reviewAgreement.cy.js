/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

const minAgreement = {
    agreement_type: "CONTRACT",
    name: "Test Contract",
    number: "TEST001",
    research_project_id: 1,
    procurement_shop_id: 1,
};

beforeEach(() => {
    testLogin("admin");
    cy.visit(`/`);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("review an agreement", () => {
    expect(localStorage.getItem("access_token")).to.exist;

    // create test agreement
    const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
    cy.request({
        method: "POST",
        url: "http://localhost:8080/api/v1/agreements/",
        body: minAgreement,
        headers: {
            Authorization: bearer_token,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.id).to.exist;
        const agreementId = response.body.id;

        cy.intercept("PATCH", "**/agreements/**").as("patchAgreement");
        cy.visit(`/agreements/approve/${agreementId}?mode=review`);
        cy.get("h1").should("have.text", "Please resolve the errors outlined below");

        cy.get('[data-cy="error-list"]').should("exist");
        cy.get('[data-cy="error-item"]').should("have.length", 7);
        //send-to-approval button should be disabled
        cy.get('[data-cy="send-to-approval-btn"]').should("be.disabled");

        //fix errors
        cy.get('[data-cy="edit-agreement-btn"]').click();
        cy.get("#continue").click();
        cy.get("#description").type("Test Description");
        cy.get("#product_service_code_id").select(1);
        cy.get("#agreement_reason").select("NEW_REQ");
        cy.get("#project-officer-select-toggle-list").click();
        cy.get("#project-officer-select-input").invoke("show");
        cy.get("#users--list").invoke("show");
        cy.get("li").contains("Chris Fortunato").click();
        cy.get("#agreementNotes").type("This is a note.");
        cy.get("[data-cy='continue-btn']").click();
        //create a budget line with errors
        cy.get("#enteredDescription").type("Test Budget Line");
        cy.get("#enteredDescription").clear();
        cy.get("#input-error-message").should("exist");
        cy.get("#enteredDescription").type("Test Budget Line");

        // delete test agreement
        cy.request({
            method: "DELETE",
            url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
            headers: {
                Authorization: bearer_token,
                Accept: "application/json",
            },
        }).then((response) => {
            expect(response.status).to.eq(200);
        });
    });
});
