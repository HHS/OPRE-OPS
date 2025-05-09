/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "Test Contract",
    description: "Test Description",
    project_id: 1000,
    product_service_code_id: 1,
    awarding_entity_id: 2,
    project_officer_id: 500,
    alternate_project_officer_id: 523,
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
    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});
describe("Agreement Details Edit", () => {
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
            cy.visit(`/agreements/${agreementId}`);
            cy.get("h1").should("have.text", "Test Contract");
            cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
            cy.get('[data-cy="agreement-history-container"]').should("exist");
            cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
            cy.get('[data-cy="agreement-history-list"]').should("exist");
            cy.get(
                '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
            ).should("exist");
            cy.get(
                '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
            ).should("have.text", "Agreement Created");
            cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-children"]').should(
                "exist"
            );
            cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-children"]').should(
                "have.text",
                "Agreement created by System Owner."
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
            cy.get("#agreementNotes").type(" test edit notes");
            cy.get("[data-cy='continue-btn']").click();

            cy.wait("@patchAgreement")
                .then((interception) => {
                    const { statusCode, body } = interception.response;
                    expect(statusCode).to.equal(200);
                    expect(body.message).to.equal("Agreement updated");
                })
                .then(cy.log);
            cy.get(".usa-alert__body").should("contain", "The agreement Test Edit Title has been successfully updated");
            cy.get("[data-cy='close-alert']").click();
            cy.get("h1").should("have.text", "Test Edit Title");
            cy.get("[data-cy='details-notes']").should("exist");
            cy.get("[data-cy='details-notes']").should("have.text", "Test Notes test edit notes");
            cy.get("#edit").should("exist");

            cy.get(
                '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
            ).should("have.text", "Agreement Title Edited");
            cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-children"]').should(
                "have.text",
                "Agreement Title changed from Test Contract to Test Edit Title by System Owner."
            );
            cy.get('[data-cy="agreement-history-list"] > :nth-child(2) > .flex-justify > .text-bold').should(
                "have.text",
                "Agreement Notes Edited"
            );
            cy.get('[data-cy="agreement-history-list"] > :nth-child(2) > [data-cy="log-item-children"]').should(
                "have.text",
                "Agreement Notes changed by System Owner."
            );
            cy.get(
                '[data-cy="agreement-history-list"] > :nth-child(3) > .flex-justify > [data-cy="log-item-title"]'
            ).should("have.text", "Agreement Description Edited");
            cy.get('[data-cy="agreement-history-list"] > :nth-child(3) > [data-cy="log-item-children"]').should(
                "have.text",
                "Agreement Description changed by System Owner."
            );

            // test alternate project officer has edit persmission
            cy.get('[data-cy="sign-out"]').click();
            cy.visit("/").wait(1000);
            testLogin("budget-team");
            cy.visit("/agreements/");
            cy.contains("tbody tr", "Test Edit Title").as("agreement-row");
            cy.get("@agreement-row").contains("Test Edit Title").click();
            cy.get("#edit").should("exist");

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

    // TODO: Update test once #3885 is done
    it("should allow Division Director or Budget Team to edit Services Components", () => {
        testLogin("division-director");
        cy.visit("/agreements/9/budget-lines").wait(1000);
        cy.get("#edit").click();
        cy.get("#servicesComponentSelect").select("2");
        cy.get("#pop-start-date").type("01/01/2044");
        cy.get("#pop-end-date").type("01/01/2045");
        cy.get("#description").type("This is a description.");
        cy.get("[data-cy='add-services-component-btn']").click();
        // check for error alert__body
        cy.get(".usa-alert__body").should("contain", "An error occurred. Please try again.");
        // check url for /error
        cy.url().should("include", "/error");
    });
});
