/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";
// get current year
const today = new Date();
const year = today.getFullYear() + 1;
const month = today.getMonth() + 1;

const blData = [
    {
        descr: "SC1",
        can: "G99HRF2",
        month: "09 - Sep",
        day: "01",
        year: "2048",
        amount: "111111",
        note: "note one"
    }
];

const minAgreement = {
    agreement_type: "CONTRACT",
    name: "Test Contract",
    research_project_id: 1,
    procurement_shop_id: 1
};

beforeEach(() => {
    testLogin("admin");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("agreement review workflow", () => {
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
                Accept: "application/json"
            }
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
            const agreementId = response.body.id;

            cy.intercept("PATCH", "**/agreements/**").as("patchAgreement");
            cy.visit(`/agreements/review/${agreementId}?mode=review`);
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
            cy.get("#agreement_reason").select("NEW_REQ");
            cy.get("#project-officer-combobox-input").type("Chris Fortunato{enter}");
            cy.get("#agreementNotes").type("This is a note.");
            cy.get("[data-cy='continue-btn']").click();
            //create a budget line with errors
            cy.get("#add-budget-line").should("be.disabled");
            cy.get("#enteredDescription").type(`${blData[0].descr}`);
            cy.get("#enteredDescription").clear();
            cy.get(".usa-error-message").should("exist");
            cy.get("#enteredDescription").type(`${blData[0].descr}`);
            // add a CAN and clear it
            cy.get("#selectedCan").type(`${blData[0].can}{enter}`);
            cy.get(".usa-combo-box__clear-input").click();
            cy.get(".usa-error-message").should("exist");
            cy.get("#selectedCan").type(`${blData[0].can}{enter}`);
            // add entered month and clear it
            cy.get("#enteredMonth").select(blData[0].month);
            cy.get("#enteredMonth").select("0");
            cy.get(".usa-error-message").should("exist");
            cy.get("#enteredMonth").select(blData[0].month);
            // add entered day and clear it and tests for invalid days
            cy.get("#enteredDay").type(`${blData[0].day}`);
            cy.get("#enteredDay").clear();
            cy.get(".usa-error-message").should("exist");
            cy.get("#enteredDay").type("0");
            cy.get(".usa-error-message").should("exist");
            cy.get("#enteredDay").clear();
            cy.get("#enteredDay").type("32");
            cy.get(".usa-error-message").should("exist");
            cy.get("#enteredDay").clear();
            cy.get("#enteredDay").type(`${blData[0].day}`);
            // add entered year and clear it and tests for invalid years
            cy.get("#enteredYear").type(`${blData[0].year}`);
            cy.get("#enteredYear").clear();
            cy.get(".usa-error-message").should("exist");
            // check for invalid years
            cy.get("#enteredYear").type("0");
            cy.get(".usa-error-message").should("exist");
            cy.get("#enteredYear").clear();
            cy.get("#enteredYear").type("12");
            cy.get(".usa-error-message").should("exist");
            cy.get("#enteredYear").clear();
            cy.get("#enteredYear").type("123");
            cy.get(".usa-error-message").should("exist");
            // check to make sure the year is in the future
            cy.get("#enteredYear").clear();
            cy.get("#enteredYear").type(`${year - 1}`);
            cy.get(".usa-error-message").should("exist");
            cy.get("#enteredYear").clear();
            cy.get("#enteredYear").type(`${year}`);
            // test for invalid dates
            cy.get("#enteredMonth").select(month);
            cy.get("#enteredDay").clear();
            cy.get("#enteredDay").type(blData[0].day);
            cy.get("#enteredYear").clear();
            cy.get("#enteredYear").type(`${year - 1}`);
            // check for date to be in the future  which should error
            cy.get('[data-cy="date-group-errors"] .usa-error-message').should("exist");
            // fix by adding a valid date
            cy.get("#enteredDay").clear();
            cy.get("#enteredDay").type(blData[0].day + 1);
            cy.get("#enteredYear").clear();
            cy.get("#enteredYear").type(`${year + 1}`);
            cy.get('[data-cy="date-group-errors"] .usa-error-message').should("not.exist");
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
            cy.visit(`/agreements/review/${agreementId}`);
            cy.url().should("include", `/agreements/review/${agreementId}`);
            cy.get("h1").should("not.have.text", "Please resolve the errors outlined below");
            cy.get('[data-cy="error-list"]').should("not.exist");
            cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
            // go back to edit mode and look for budget line errors
            cy.visit(`/agreements/edit/${agreementId}?mode=edit`);
            cy.get("#continue").click();
            cy.get(".usa-form-group--error").should("not.exist");
            cy.get('[data-cy="continue-btn"]').click();
            // add incomplete budget line
            cy.get("#enteredDescription").type(`${blData[0].descr}`);
            cy.get("#add-budget-line").should("not.be.disabled");
            cy.get("#add-budget-line").click();
            // patch agreement
            cy.get('[data-cy="continue-btn"]').click();
            //check for new budget line errors
            cy.visit(`/agreements/review/${agreementId}?mode=review`);
            cy.get("h1").should("have.text", "Please resolve the errors outlined below");
            cy.get('[data-cy="error-list"]').should("exist");
            cy.get('[data-cy="error-item"]').should("have.length", 1);
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
            cy.get("#selectedCan").type(`${blData[0].can}{enter}`);
            cy.get("#enteredMonth").select(blData[0].month);
            cy.get("#enteredDay").type(`${blData[0].day}`);
            cy.get("#enteredYear").type(`${blData[0].year}`);
            cy.get("#enteredAmount").type(`${blData[0].amount}`);
            cy.get("#enteredComments").type(`${blData[0].note}`);
            cy.get('[data-cy="update-budget-line"]').should("not.be.disabled");
            cy.get('[data-cy="update-budget-line"]').click();
            cy.get('[data-cy="error-item"]').should("not.exist");
            // patch agreement
            cy.get('[data-cy="continue-btn"]').click();
            //check review page
            cy.visit(`/agreements/review/${agreementId}?mode=review`);
            cy.get("h1").should("not.have.text", "Please resolve the errors outlined below");
            cy.get('[data-cy="error-list"]').should("not.exist");
            cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
            // can't delete budget line in review mode so won't click review button

            // delete test agreement
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
                cy.visit(`/agreements/review/${agreementId}?mode=review`);
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
                cy.get("#agreement_reason").select("NEW_REQ");
                cy.get("#project-officer-combobox-input").type("Chris Fortunato{enter}");
                cy.get("#agreementNotes").type("This is a note.");
                cy.get("[data-cy='continue-btn']").click();
                //create a budget line with errors
                cy.get("#add-budget-line").should("be.disabled");
                cy.get("#enteredDescription").type(`${blData[0].descr}`);
                cy.get("#enteredDescription").clear();
                cy.get(".usa-error-message").should("exist");
                cy.get("#enteredDescription").type(`${blData[0].descr}`);
                // add a CAN and clear it
                cy.get("#selectedCan").type(`${blData[0].can}{enter}`);
                cy.get(".usa-combo-box__clear-input").click();
                cy.get(".usa-error-message").should("exist");
                cy.get("#selectedCan").type(`${blData[0].can}{enter}`);
                // add entered month and clear it
                cy.get("#enteredMonth").select(blData[0].month);
                cy.get("#enteredMonth").select("0");
                cy.get(".usa-error-message").should("exist");
                cy.get("#enteredMonth").select(blData[0].month);
                // add entered day and clear it and tests for invalid days
                cy.get("#enteredDay").type(`${blData[0].day}`);
                cy.get("#enteredDay").clear();
                cy.get(".usa-error-message").should("exist");
                cy.get("#enteredDay").type("0");
                cy.get(".usa-error-message").should("exist");
                cy.get("#enteredDay").clear();
                cy.get("#enteredDay").type("32");
                cy.get(".usa-error-message").should("exist");
                cy.get("#enteredDay").clear();
                cy.get("#enteredDay").type(`${blData[0].day}`);
                // add entered year and clear it and tests for invalid years
                cy.get("#enteredYear").type(`${blData[0].year}`);
                cy.get("#enteredYear").clear();
                cy.get(".usa-error-message").should("exist");
                // check for invalid years
                cy.get("#enteredYear").type("0");
                cy.get(".usa-error-message").should("exist");
                cy.get("#enteredYear").clear();
                cy.get("#enteredYear").type("12");
                cy.get(".usa-error-message").should("exist");
                cy.get("#enteredYear").clear();
                cy.get("#enteredYear").type("123");
                cy.get(".usa-error-message").should("exist");
                // check to make sure the year is in the future
                cy.get("#enteredYear").clear();
                cy.get("#enteredYear").type(`${year - 1}`);
                cy.get(".usa-error-message").should("exist");
                cy.get("#enteredYear").clear();
                cy.get("#enteredYear").type(`${year}`);
                // test for invalid dates
                cy.get("#enteredMonth").select(month);
                cy.get("#enteredDay").clear();
                cy.get("#enteredDay").type(blData[0].day);
                cy.get("#enteredYear").clear();
                cy.get("#enteredYear").type(`${year - 1}`);
                // check for date to be in the future  which should error
                cy.get('[data-cy="date-group-errors"] .usa-error-message').should("exist");
                // fix by adding a valid date
                cy.get("#enteredDay").clear();
                cy.get("#enteredDay").type(blData[0].day + 1);
                cy.get("#enteredYear").clear();
                cy.get("#enteredYear").type(`${year + 1}`);
                cy.get('[data-cy="date-group-errors"] .usa-error-message').should("not.exist");
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
                cy.visit(`/agreements/review/${agreementId}`);
                cy.url().should("include", `/agreements/review/${agreementId}`);
                cy.get("h1").should("not.have.text", "Please resolve the errors outlined below");
                cy.get('[data-cy="error-list"]').should("not.exist");
                cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
                // go back to edit mode and look for budget line errors
                cy.visit(`/agreements/edit/${agreementId}?mode=edit`);
                cy.get("#continue").click();
                cy.get(".usa-form-group--error").should("not.exist");
                cy.get('[data-cy="continue-btn"]').click();
                // add incomplete budget line
                cy.get("#enteredDescription").type(`${blData[0].descr}`);
                cy.get("#add-budget-line").should("not.be.disabled");
                cy.get("#add-budget-line").click();
                // patch agreement
                cy.get('[data-cy="continue-btn"]').click();
                //check for new budget line errors
                cy.visit(`/agreements/review/${agreementId}?mode=review`);
                cy.get("h1").should("have.text", "Please resolve the errors outlined below");
                cy.get('[data-cy="error-list"]').should("exist");
                cy.get('[data-cy="error-item"]').should("have.length", 1);
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
                cy.get("#selectedCan").type(`${blData[0].can}{enter}`);
                cy.get("#enteredMonth").select(blData[0].month);
                cy.get("#enteredDay").type(`${blData[0].day}`);
                cy.get("#enteredYear").type(`${blData[0].year}`);
                cy.get("#enteredAmount").type(`${blData[0].amount}`);
                cy.get("#enteredComments").type(`${blData[0].note}`);
                cy.get('[data-cy="update-budget-line"]').should("not.be.disabled");
                cy.get('[data-cy="update-budget-line"]').click();
                cy.get('[data-cy="error-item"]').should("not.exist");
                // patch agreement
                cy.get('[data-cy="continue-btn"]').click();
                //check review page
                cy.visit(`/agreements/review/${agreementId}?mode=review`);
                cy.get("h1").should("not.have.text", "Please resolve the errors outlined below");
                cy.get('[data-cy="error-list"]').should("not.exist");
                cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
                // can't delete budget line in review mode so won't click review button

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
});

describe("agreement change accordion", () => {
    it("handles interactions", () => {
        cy.visit("/agreements/review/1").wait(1000);
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get("#check-all").should("exist").should("be.disabled");
        cy.get('[data-cy="agreement-total-card"]').should("exist").contains("$0");
        cy.get('[data-cy="can-total-card-G994426"]').should("not.exist");
        // click action radio button
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.get("#check-all").check({ force: true }).wait(1);
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        cy.get('[data-cy="agreement-total-card"]').contains("$2,000,000.00");
        cy.get('[data-cy="can-total-card-G994426"]').contains("$2,000,000.00");
    });
});

describe("agreement BLI accordion", () => {
    it("should contain summary card", () => {
        cy.visit("/agreements/review/1");
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get('[data-cy="blis-by-fy-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').should("exist");
    });

    it("allow to select individual budget lines", () => {
        cy.visit("/agreements/review/1").wait(1000);
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.get("#1").check({ force: true });
        cy.get("#2").check({ force: true });
    });

    it("should handle check-all and uncheck all", () => {
        cy.visit("/agreements/review/1").wait(1000);
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get("#check-all").should("exist").should("be.disabled");
        // click action radio button
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.get("#check-all").check({ force: true });
        // all checkboxes should be checked
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        // uncheck all
        cy.get("#check-all").uncheck({ force: true });
        // all checkboxes should be unchecked
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("not.be.checked");
            });
    });

    it("should handle after approval toggle on Agreement1", () => {
        cy.visit("/agreements/review/1").wait(1000);
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.get("#check-all").check({ force: true });
        cy.get('[data-cy="button-toggle-After Approval"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').contains("2,000,000");
        cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
        cy.get('[data-cy="currency-summary-card"]').contains("0");
        // Agreement 9
        cy.visit("/agreements/review/1").wait(1000);
    });

    it("should handle after approval toggle on Agreement 2", () => {
        cy.visit("/agreements/review/2").wait(1000);
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        cy.get("#check-all").check({ force: true });
        cy.get('[data-cy="button-toggle-After Approval"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').contains("$32,000,000.00");
        cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
        cy.get('[data-cy="currency-summary-card"]').contains("$32,000,000.00");
    });
});

describe("agreement action accordion", () => {
    it("should have draft option available on agreement one", () => {
        cy.visit("/agreements/review/1").wait(1000);
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get("@acc-btn").type("{enter}");
        cy.get('input[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("be.disabled");
    });

    it("should have planned option available on agreement nine", () => {
        cy.visit("/agreements/review/9");
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get("@acc-btn").type("{enter}");
        cy.get('input[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("be.disabled");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("not.be.disabled");
    });
});
describe("agreement review CANS accordion", () => {
    it("should not have any CANS cards unless BLIs are selected", () => {
        cy.visit("/agreements/review/1").wait(1000);
        // pre-change
        cy.get("h2").contains("Review CANs").should("exist");
        cy.get('[data-cy="can-funding-summary-card"]').should("not.exist");
        // select all BLIs to show CANS cards
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.wait(1);
        cy.get("#check-all").check({ force: true });
        cy.wait(1);
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        cy.get('[data-cy="can-funding-summary-card-5"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-5"]').contains("$40,000,000.00");
    });

    it.only("should handle after approval toggle", () => {
        cy.visit("/agreements/review/1").wait(1000);
        // pre-change
        cy.get('[data-cy="button-toggle-After Approval"]').should("exist");
        cy.get('[data-cy="button-toggle-After Approval"]').first().should("exist");
        // select all BLIs to show CANS cards
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.wait(1);
        cy.get("#check-all").check({ force: true });
        cy.wait(1);
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        cy.get('[data-cy="can-funding-summary-card-5"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-5"]').contains("5,000,000");
        cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
        cy.get('[data-cy="can-funding-summary-card-5"]').contains("3,000,000");
    });

    it("should handle over budget CANs", () => {
        cy.visit("/agreements/review/2").wait(1000);
        // pre-change
        // select all BLIs to show CANS cards
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        cy.wait(1);
        cy.get("#check-all").check({ force: true });
        cy.wait(1);
        cy.get('[type="checkbox"]').should("have.length", 17);
        cy.get('[data-cy="can-funding-summary-card-8"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-9"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-8"]').contains("Over Budget");
        cy.get('[data-cy="can-funding-summary-card-9"]').contains("Over Budget");
    });
});
