/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

const randomNumber = Math.floor(Math.random() * 1000000);
const randomNumber2 = Math.floor(Math.random() * 1000000);

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

const minAgreement2 = {
    agreement_type: "CONTRACT",
    name: `Test Contract ${randomNumber2}`,
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
            // click option and check all budget lines
            cy.get('[type="radio"]').first().check({ force: true });
            cy.get("#check-all").check({ force: true }).wait(1);
            cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");

            // can't delete budget line in review mode so won't click review button

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
    it("review an agreement and DRAFT to PLANNED to EXECUTING", () => {
        expect(localStorage.getItem("access_token")).to.exist;

        // create test agreement
        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
        cy.request({
            method: "POST",
            url: "http://localhost:8080/api/v1/agreements/",
            body: minAgreement2,
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
            cy.get("#agreement_reason").select("NEW_REQ");
            cy.get("#serviceReqType").select("Severable");
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
            cy.get(".usa-error-message").should("exist");
            // fix
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
            // click option and check all budget lines
            cy.get('[type="radio"]').first().check({ force: true });
            cy.get("#check-all").check({ force: true }).wait(1);
            cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
            cy.get('[data-cy="send-to-approval-btn"]').click();
            // confirm BLIS are in IN_REVIEW status
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            // table should have 2 rows
            cy.get("tbody").children().as("table-rows").should("have.length", 2);

            // get table rows and should have text In Review
            cy.get("@table-rows").eq(0).should("contain", "In Review");
            cy.get("@table-rows").eq(1).should("contain", "In Review");
            //approve agreement
            cy.visit("/agreements?filter=change-requests").wait(1000);
            // TODO: add approve tests for change requests
            // should contain 2 headings named Status Change
            cy.get('[data-cy="review-card"]').should("have.length", 2);
            // cy.get("tbody").children().as("table-rows").should("exist");
            // get the created agreement which is last in the table
            // cy.get("@table-rows").last().find('[data-cy="expand-row"]').click();
            // cy.get('[data-cy="go-to-approve-row"]').click();
            // check the checkbox for approval
            // cy.get('[data-cy="send-to-approval-btn"]').should("be.disabled");
            // cy.get(".usa-checkbox").click(); // confirm approval
            // cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
            // cy.get('[data-cy="send-to-approval-btn"]').click(); // unlocks the button
            // cy.get('[data-cy="confirm-action"]').click().wait(1000); // confirmation modal
            //confirm BLIS are in Planned status
            // cy.visit(`/agreements/${agreementId}/budget-lines`);
            // table should have 2 rows
            // cy.get("tbody").children().as("table-rows").should("have.length", 2);

            // get table rows and should have text In Review
            // cy.get("@table-rows").eq(0).should("contain", "Planned");
            // cy.get("@table-rows").eq(1).should("contain", "Planned");

            // submit for EXECUTING
            // cy.visit(`/agreements/review/${agreementId}?mode=review`).wait(1000);
            // cy.get("h1").should("not.have.text", "Please resolve the errors outlined below");
            // cy.get('[data-cy="error-list"]').should("not.exist");
            // cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
            // cy.get("#check-all").check({ force: true }).wait(1);
            // cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
            // cy.get('[data-cy="send-to-approval-btn"]').click();
            // confirm BLIS are in IN_REVIEW status
            // cy.visit(`/agreements/${agreementId}/budget-lines`);
            // table should have 2 rows
            // cy.get("tbody").children().as("table-rows").should("have.length", 2);

            // get table rows and should have text In Review
            // cy.get("@table-rows").eq(0).should("contain", "In Review");
            // cy.get("@table-rows").eq(1).should("contain", "In Review");
            //approve agreement
            // cy.visit("/agreements?filter=change-requests").wait(1000);
            // cy.get("tbody").children().as("table-rows").should("exist");
            // get the created agreement
            // cy.get("@table-rows").last().find('[data-cy="expand-row"]').click();
            // cy.get('[data-cy="go-to-approve-row"]').click();
            // check the checkbox for approval
            // cy.get('[data-cy="send-to-approval-btn"]').should("be.disabled");
            // cy.get(".usa-checkbox").click(); // confirm approval
            // cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
            // cy.get('[data-cy="send-to-approval-btn"]').click(); // unlocks the button
            // cy.get('[data-cy="confirm-action"]').click().wait(1000); // confirmation modal
            //confirm BLIS are in EXECUTING status
            // cy.visit(`/agreements/${agreementId}/budget-lines`);
            // table should have 2 rows
            // cy.get("tbody").children().as("table-rows").should("have.length", 2);
            // get table rows and should have text In Review
            // cy.get("@table-rows").eq(0).should("contain", "Executing");
            // cy.get("@table-rows").eq(1).should("contain", "Executing");

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

describe("agreement change accordion", () => {
    it("handles interactions", () => {
        cy.visit("/agreements/review/1").wait(1000);
        cy.get("h2").contains("Select Budget Lines").as("acc-btn");
        cy.get(".usa-table").should("exist");
        cy.get("#check-all").should("exist").should("be.disabled");
        cy.get('[data-cy="can-total-card-G994426"]').should("not.exist");
        cy.get('[data-cy="agreement-total-card"]').should("not.exist");
        // click action radio button
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.get('[data-cy="agreement-total-card"]').should("exist").contains("$0");
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
        cy.get("#check-all").check({ force: true }).wait(1);
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
        cy.get("#check-all").check({ force: true }).wait(1);
        cy.get('[data-cy="button-toggle-After Approval"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').should("exist");
        cy.get('[data-cy="currency-summary-card"]').contains("2,000,000");
        cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
        cy.get('[data-cy="currency-summary-card"]').contains("0");
    });

    it("should handle after approval toggle on Agreement 2", () => {
        cy.visit("/agreements/review/2").wait(1000);
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        cy.get("#check-all").check({ force: true }).wait(1);
        cy.get('[data-cy="currency-summary-card"]').should("exist");
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
        cy.get("#check-all").check({ force: true }).wait(1);
        cy.wait(1);
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        cy.get('[data-cy="can-funding-summary-card-504"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-504"]').contains("$40,000,000.00");
    });

    it("should handle after approval toggle", () => {
        cy.visit("/agreements/review/1").wait(1000);
        // pre-change
        // select all BLIs to show CANS cards
        cy.get("h2").contains("Choose an Action").as("acc-btn").should("exist");
        cy.get('input[id="Change Draft Budget Lines to Planned Status"]').should("exist").should("not.be.disabled");
        // check the radio button
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('[type="radio"]').first().check({ force: true });
        cy.wait(1);
        cy.get('[data-cy="button-toggle-After Approval"]').should("exist");
        cy.get('[data-cy="button-toggle-After Approval"]').first().should("exist");
        cy.get("#check-all").check({ force: true }).wait(1);
        cy.wait(1);
        cy.get('[type="checkbox"]')
            .should("have.length", 3)
            .each((checkbox) => {
                cy.wrap(checkbox).should("be.checked");
            });
        cy.get('[data-cy="can-funding-summary-card-504"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-504"]').contains("5,000,000");
        cy.get('[data-cy="button-toggle-After Approval"]').first().click({ force: true });
        cy.get('[data-cy="can-funding-summary-card-504"]').contains("3,000,000");
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
        cy.get("#check-all").check({ force: true }).wait(1);
        cy.wait(1);
        cy.get('[type="checkbox"]').should("have.length", 17);
        cy.get('[data-cy="can-funding-summary-card-507"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-508"]').should("exist");
        cy.get('[data-cy="can-funding-summary-card-507"]').contains("Over Budget");
        cy.get('[data-cy="can-funding-summary-card-508"]').contains("Over Budget");
    });
});

describe("Additional Information accordion", () => {
    it("should not have any additional information unless BLIs are selected", () => {
        cy.visit("/agreements/review/9").wait(1000);
        cy.get('[type="radio"]').should("have.length", 2);
        cy.get('input[id="Change Planned Budget Lines to Executing Status"]').check({ force: true });
        // info-accordion should exist
        cy.get("h2").contains("Additional Information").as("info-accordion").should("exist");
    });
});
