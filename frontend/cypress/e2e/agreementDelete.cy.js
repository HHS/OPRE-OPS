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
    cy.visit("/agreements/");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

const handleModal = () => {};
const addAgreement = () => {
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
    });
};

it("loads with 8 agreements", () => {
    // get the table of agreements
    cy.get("tbody").children().as("table-rows").should("have.length", 8);
});
// should allow to delete an agreement if user is project officer
it("should allow to delete an agreement if user is project officer", () => {
    cy.get("tbody").children().as("table-rows").should("have.length", 8);
    addAgreement();
    // get the table of agreements
    cy.get("tbody").children().as("table-rows").should("exist");
    // get the created agreement
    cy.get("@table-rows").last().as("last-row");
    // expand the row
    cy.get("@last-row").find('[data-cy="expand-row"]').click();
    // get the first delete button and click
    cy.get(".padding-right-9").find('[data-cy="delete-agreement"]').click();
    // get the modal
    cy.get("#ops-modal-heading").should("have.text", "Are you sure you want to delete this agreement?");
    // find the delete button and click
    cy.get('[data-cy="confirm-action"]').click();
    // get the table and see if the row is gone
    cy.get("@table-rows").should("have.length", 8);
});

// should allow to delete an agreement if user is a team member
// should allow to delete an agreement if user created the agreement
// should not allow to delete an agreement if user is not project officer or team member or didn't create the agreement
