/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "Test Contract",
    number: "TEST001",
    description: "Test Description",
    research_project_id: 1,
    product_service_code_id: 1,
    procurement_shop_id: 1,
    incumbent: "Test Vendor",
    project_officer: 1,
    team_members: [
        {
            id: 3,
        },
        {
            id: 5,
        },
    ],
    notes: "Test Notes",
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
            Accept: "application/json",
        },
    }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.id).to.exist;
        const agreementId = response.body.id;

        cy.intercept("PATCH", "**/agreements/**").as("patchAgreement");
        cy.visit(`/agreements/${agreementId}`);
        cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > .margin-0').should(
            "have.text",
            'New Contract Agreement, "Test Contract", created by Admin Demo.'
        );
        cy.get("#edit").click();
        cy.get("#edit").should("not.exist");
        cy.get('[data-cy="continue-btn"]').should("exist");
        cy.get("h1").should("have.text", "Test Contract");
        // test validation
        cy.get("#name").clear();
        cy.get("#name").blur();
        cy.get(".usa-error-message").should("contain", "This is required information");
        cy.get("[data-cy='continue-btn']").should("be.disabled");
        cy.get("#name").type("Test Edit Title");
        cy.get(".usa-error-message").should("not.exist");
        cy.get("[data-cy='continue-btn']").should("not.be.disabled");
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
        cy.get(".usa-alert__body").should("contain", "Agreement Draft Saved");
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(6000);
        cy.get("h1").should("have.text", "Test Edit Title");
        cy.get("#edit").should("exist");

        cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > .margin-0').should(
            "have.text",
            'Contract Agreement, "Test Edit Title", updated by Admin Demo.'
        );
        // there's currently a false change for agreement_reason, these child indexes will need to changed when that is fixed
        cy.get(":nth-child(1) > dl > :nth-child(3)").should("have.text", "Description");
        cy.get(":nth-child(1) > dl > :nth-child(4)").should(
            "contain.text",
            "changed from “Test Description” to “Test Description more text”"
        );
        cy.get("dl > :nth-child(5)").should("have.text", "Title");
        cy.get("dl > :nth-child(6)").should("contain.text", "changed from “Test Contract” to “Test Edit Title”");
        cy.get("dl > :nth-child(7)").should("have.text", "Notes");
        cy.get("dl > :nth-child(8)").should("contain.text", "changed from “Test Notes” to “Test Notestest edit notes”");

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
