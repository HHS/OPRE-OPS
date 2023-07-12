/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";
// get current year
const today = new Date();
const year = today.getFullYear();

const blData = [
    {
        descr: "SC1",
        can: "G99HRF2",
        month: "09 - Sep",
        day: "01",
        year: "2023",
        amount: "111111",
        note: "note one",
    },
];

const minAgreement = {
    agreement_type: "CONTRACT",
    name: "Test Contract",
    number: "TEST001",
    research_project_id: 1,
    procurement_shop_id: 1,
};

const createBudgetLine = (bl) => {
    cy.get("#bl-description").type(bl.descr);
    cy.get("#can-select").type(`${bl.can}{enter}`);
    cy.get("#procurement_month").select(bl.month);
    cy.get("#procurement_day").type(bl.day);
    cy.get("#procurement_year").type(bl.year);
    cy.get("#bl-amount").type(bl.amount);
    cy.get("#with-hint-textarea").type(bl.note);
    cy.get("#add-budget-line").click();
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
        // get all errors on page, should be 4
        cy.get(".usa-form-group--error").should("have.length", 4);
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
        cy.get("#add-budget-line").should("be.disabled");
        cy.get("#enteredDescription").type(`${blData[0].descr}`);
        cy.get("#enteredDescription").clear();
        cy.get("#input-error-message").should("exist");
        cy.get("#enteredDescription").type(`${blData[0].descr}`);
        // add a CAN and clear it
        cy.get("#selectedCan").type(`${blData[0].can}{enter}`);
        cy.get(".usa-combo-box__clear-input").click();
        cy.get("#input-error-message").should("exist");
        cy.get("#selectedCan").type(`${blData[0].can}{enter}`);
        // add entered month and clear it
        cy.get("#enteredMonth").select(blData[0].month);
        cy.get("#enteredMonth").select("0");
        cy.get("#input-error-message").should("exist");
        cy.get("#enteredMonth").select(blData[0].month);
        // add entered day and clear it and tests for invalid days
        cy.get("#enteredDay").type(`${blData[0].day}`);
        cy.get("#enteredDay").clear();
        cy.get("#input-error-message").should("exist");
        cy.get("#enteredDay").type("0");
        cy.get("#input-error-message").should("exist");
        cy.get("#enteredDay").clear();
        cy.get("#enteredDay").type("32");
        cy.get("#input-error-message").should("exist");
        cy.get("#enteredDay").clear();
        cy.get("#enteredDay").type(`${blData[0].day}`);
        // add entered year and clear it and tests for invalid years
        cy.get("#enteredYear").type(`${blData[0].year}`);
        cy.get("#enteredYear").clear();
        cy.get("#input-error-message").should("exist");
        // check fpr invalid years
        cy.get("#enteredYear").type("0");
        cy.get("#input-error-message").should("exist");
        cy.get("#enteredYear").clear();
        cy.get("#enteredYear").type("12");
        cy.get("#input-error-message").should("exist");
        cy.get("#enteredYear").clear();
        cy.get("#enteredYear").type("123");
        cy.get("#input-error-message").should("exist");
        // check to make sure the year is in the future
        cy.get("#enteredYear").clear();
        cy.get("#enteredYear").type(`${year - 1}`);
        cy.get("#input-error-message").should("exist");
        cy.get("#enteredYear").clear();
        cy.get("#enteredYear").type(`${year}`);
        cy.get("#input-error-message").should("not.exist");
        // add entered amount and clear it
        cy.get("#enteredAmount").type(`${blData[0].amount}`);
        cy.get("#enteredAmount").clear();
        cy.get("#input-error-message").should("exist");
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
        cy.get("h1").should("not.have.text", "Please resolve the errors outlined below");
        cy.get('[data-cy="error-list"]').should("not.exist");
        cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");

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
