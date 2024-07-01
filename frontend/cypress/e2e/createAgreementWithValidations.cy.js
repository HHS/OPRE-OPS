/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

const randomNumber = Math.floor(Math.random() * 1000000);

const blData = [
    {
        services_component: "Base Period 1",
        can: "G99HRF2",
        needByDate: "09/01/2048",
        amount: "111111",
        note: "note one"
    }
];

const minAgreement = {
    agreement_type: "CONTRACT",
    name: `Test Contract ${randomNumber}`,
    project_id: 1000,
    procurement_shop_id: 1
};

beforeEach(() => {
    testLogin("admin");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("create agreement and test validations", () => {
    it("create an agreement", () => {
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
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
            const agreementId = response.body.id;

            cy.intercept("PATCH", "**/agreements/**").as("patchAgreement");
            cy.visit(`/agreements/review/${agreementId}?mode=review`).wait(1000);
            cy.get("h1").should("have.text", "Please resolve the errors outlined below");

            cy.get('[data-cy="error-list"]').should("exist");
            cy.get('[data-cy="error-item"]').should("have.length", 7);
            //send-to-approval button should be disabled
            cy.get('[data-cy="send-to-approval-btn"]').should("be.disabled");

            //fix errors
            cy.get('[data-cy="edit-agreement-btn"]').click();
            cy.get("#continue").click();
            // get all errors on page, should be 4
            cy.get(".usa-form-group--error").should("have.length", 4);
            cy.get("#description").type("Test Description");
            cy.get("#product_service_code_id").select(1);
            cy.get("#serviceReqType").select("Severable");
            cy.get("#agreement_reason").select("NEW_REQ");
            cy.get("#project-officer-combobox-input").type("Chris Fortunato{enter}");
            cy.get("#team-member-combobox-input").type("Admin Demo{enter}");
            cy.get("#agreementNotes").type("This is a note.");
            cy.get("[data-cy='continue-btn']").click();
            //  Add Services Component
            cy.get("p").should("contain", "You have not added any Services Component yet.");
            cy.get("#servicesComponentSelect").select("1");
            cy.get("#pop-start-date").type("01/01/2024");
            cy.get("#pop-end-date").type("01/01/2025");
            cy.get("#description").type("This is a description.");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("h2").should("contain", "Base Period 1");
            //create a budget line with errors
            cy.get("#add-budget-line").should("be.disabled");
            cy.get("#allServicesComponentSelect").select(`${blData[0].services_component}`);
            // add a CAN and clear it
            cy.get("#can-combobox-input").type(`${blData[0].can}{enter}`);
            cy.get(".can-combobox__clear-indicator").click();
            cy.get(".usa-error-message").should("exist");
            cy.get("#can-combobox-input").type(`${blData[0].can}{enter}`);
            // ensure date is in the future
            cy.get("#need-by-date").type("09/01/1998");
            // check for date to be in the future  which should error
            cy.get(".usa-error-message").should("exist");
            // fix by adding a valid date
            cy.get("#need-by-date").clear();
            // test for invalid date
            cy.get("#need-by-date").type("tacocat");
            cy.get(".usa-error-message").should("exist");
            // fix by adding a valid date
            cy.get("#need-by-date").clear();
            cy.get("#need-by-date").type(blData[0].needByDate);
            // add entered amount and clear it
            cy.get("#enteredAmount").type(`${blData[0].amount}`);
            cy.get("#enteredAmount").clear();
            cy.get(".usa-error-message").should("exist");
            cy.get("#enteredAmount").type(`${blData[0].amount}`);
            cy.get("#add-budget-line").should("not.be.disabled");
            // add comment and clear it
            cy.get("#enteredComments").type(`${blData[0].note}`);
            cy.get("#enteredComments").clear();
            cy.get("#input-error-message").should("not.exist");
            cy.get("#enteredComments").type(`${blData[0].note}`);
            // add budget line
            cy.get("#add-budget-line").click();
            // go back to review page
            cy.get('[data-cy="continue-btn"]').click();
            // not sure why but need to manually navigate to get the error banner to not show up
            cy.visit(`/agreements/review/${agreementId}`).wait(1000);
            cy.url().should("include", `/agreements/review/${agreementId}`);
            cy.get("h1").should("not.have.text", "Please resolve the errors outlined below");
            cy.get('[data-cy="error-list"]').should("not.exist");
            // click option and check all budget lines
            cy.get('[type="radio"]').first().check({ force: true });
            cy.get("#check-all").check({ force: true }).wait(1);
            cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");

            // go back to edit mode and look for budget line errors
            cy.visit(`/agreements/edit/${agreementId}?mode=edit`);
            cy.get("#continue").click();
            cy.get(".usa-form-group--error").should("not.exist");
            cy.get('[data-cy="continue-btn"]').click();
            // add incomplete budget line
            cy.get("#allServicesComponentSelect").select(`${blData[0].services_component}`);
            cy.get("#add-budget-line").should("not.be.disabled");
            cy.get("#add-budget-line").click();
            // patch agreement
            cy.get('[data-cy="continue-btn"]').click();
            //check for new budget line errors
            cy.visit(`/agreements/review/${agreementId}?mode=review`).wait(1000);
            cy.get("h1").should("have.text", "Please resolve the errors outlined below");
            cy.get('[data-cy="error-list"]').should("exist");
            cy.get('[data-cy="error-item"]').should("have.length", 2);
            //send-to-approval button should be disabled
            cy.get('[data-cy="send-to-approval-btn"]').should("be.disabled");

            // fix errors
            cy.get('[data-cy="edit-agreement-btn"]').click();
            cy.get("#continue").click();
            cy.get('[data-cy="continue-btn"]').click();
            // check for new budget line errors
            cy.get('[data-cy="error-item"]').should("exist");
            cy.get("tbody").children().as("table-rows").should("have.length", 2);
            cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
            cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
            cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
            cy.get("[data-cy='edit-row']").click();
            cy.get(".usa-form-group--error").should("have.length", 3);
            cy.get('[data-cy="update-budget-line"]').should("be.disabled");
            // fix errors
            cy.get("#can-combobox-input").type(`${blData[0].can}{enter}`);
            cy.get("#allServicesComponentSelect").select(`${blData[0].services_component}`);
            cy.get("#need-by-date").type(`${blData[0].needByDate}`);
            cy.get("#enteredAmount").type(`${blData[0].amount}`);
            cy.get("#enteredComments").type(`${blData[0].note}`);
            cy.get('[data-cy="update-budget-line"]').should("not.be.disabled");
            cy.get('[data-cy="update-budget-line"]').click();
            cy.get('[data-cy="error-item"]').should("not.exist");
            // patch agreement
            cy.get('[data-cy="continue-btn"]').click();
            //check review page
            cy.visit(`/agreements/review/${agreementId}?mode=review`).wait(1000);
            cy.get("h1").should("not.have.text", "Please resolve the errors outlined below");
            cy.get('[data-cy="error-list"]').should("not.exist");

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
