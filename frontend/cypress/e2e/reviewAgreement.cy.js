/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

const minAgreement = {
    agreement_type: "CONTRACT",
    // agreement_reason: "NEW_REQ",
    name: "Test Contract",
    number: "TEST001",
    // description: "Test Description",
    research_project_id: 1,
    // product_service_code_id: 1,
    procurement_shop_id: 1,
    // incumbent: "Test Vendor",
    // project_officer: 1,
    // team_members: [
    //     {
    //         id: 3,
    //     },
    //     {
    //         id: 5,
    //     },
    // ],
    // notes: "Test Notes",
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
        cy.visit(`/agreements/approve/${agreementId}`);
        cy.get("h1").should("have.text", "Please resolve the errors outlined below");
        cy.get('[data-cy="error-list"]').should("exist");
        cy.get('[data-cy="error-item"]').should("have.length", 8);
        //send-to-approval button should be disabled
        cy.get('[data-cy="send-to-approval-btn"]').should("be.disabled");

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
