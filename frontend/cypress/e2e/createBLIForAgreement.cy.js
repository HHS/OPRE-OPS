/// <reference types="cypress" />
// When I try to add the first BLI to a new Agreement on the Create Budget Lines page, the application crashes.

import { terminalLog, testLogin } from "./utils";

const minAgreement = {
    agreement_type: "CONTRACT",
    name: `Test Contract No Crashing`,
    project_id: 1000,
    awarding_entity_id: 1
};

beforeEach(() => {
    testLogin("system-owner");
    cy.visit(`/`);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("should not crash when adding a BLI to a new Agreement", () => {
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
            Accept: "application/json"
        }
    })
        .then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
            const agreementId = response.body.id;
            return agreementId;
        })
        .then((agreementId) => {
            cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
            // click on edit button with id #edit
            cy.get("#edit").click();
            // expect heading Test Contract No Crashing to exist
            cy.get("h1")
                .should("have.text", minAgreement.name)
                .then(() => {
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
