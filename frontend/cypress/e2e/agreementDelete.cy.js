/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

const randomString = Math.floor(Math.random() * Date.now()).toString(36);

// eslint-disable-next-line no-unused-vars
const testAgreements = [
    {
        agreement: 1,
        row: 0,
        created_by: 4,
        project_officer_id: 1,
        team_members: [1, 4],
        BLIsAllDraft: true,
        shouldDelete: true
    },
    {
        agreement: 2,
        row: 1,
        created_by: 4,
        project_officer_id: 1,
        team_members: [1, 4],
        BLIsAllDraft: false,
        shouldDelete: false
    },
    {
        agreement: 7,
        row: 2,
        created_by: 4,
        project_officer_id: null,
        team_members: [],
        BLIsAllDraft: false,
        shouldDelete: false
    },
    {
        agreement: 8,
        row: 3,
        created_by: 4,
        project_officer_id: null,
        team_members: [],
        BLIsAllDraft: false,
        shouldDelete: false
    },
    {
        agreement: 3,
        row: 4,
        created_by: 4,
        project_officer_id: 1,
        team_members: [],
        BLIsAllDraft: 0,
        shouldDelete: true
    },
    {
        agreement: 4,
        row: 5,
        created_by: 4,
        project_officer_id: 1,
        team_members: [],
        BLIsAllDraft: 0,
        shouldDelete: true
    },
    {
        agreement: 5,
        row: 6,
        created_by: 4,
        project_officer_id: 1,
        team_members: [],
        BLIsAllDraft: 0,
        shouldDelete: true
    },
    {
        agreement: 6,
        row: 7,
        created_by: 4,
        project_officer_id: 1,
        team_members: [],
        BLIsAllDraft: 0,
        shouldDelete: true
    }
];
const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "Test Contract" + randomString,
    display_name: "Test Contract",
    description: "Test Description",
    research_project_id: 1,
    product_service_code_id: 1,
    procurement_shop_id: 1,
    incumbent: "Test Vendor",
    project_officer_id: 1,
    team_members: [
        {
            id: 3
        },
        {
            id: 5
        }
    ],
    notes: "Test Notes"
};

beforeEach(() => {
    testLogin("admin");
    cy.visit("/agreements/");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

const deleteLastAgreement = () => {
    cy.get("tbody").children().as("table-rows").should("exist");
    // get the created agreement
    cy.get("@table-rows").last().as("last-row");
    // expand the row
    cy.get("@last-row").find('[data-cy="expand-row"]').click();
    // adding a little wait, trying to increase odds of success
    cy.wait(2000);
    // get the first delete button and click
    cy.get(".padding-right-9").find('[data-cy="delete-row"]').click();
    // get the modal
    cy.get("#ops-modal-heading").should("have.text", "Are you sure you want to delete this agreement?");
    // find the delete button and click
    cy.get('[data-cy="confirm-action"]').click();
};

const deleteAgreementByRow = (row) => {
    cy.get("tbody").children().as("table-rows").should("exist");
    // get the created agreement
    cy.get("@table-rows").eq(row).find('[data-cy="expand-row"]').click();
    // get the first delete button and click
    cy.get(".padding-right-9").find('[data-cy="delete-row"]').click();
    // get the modal and cancel
    cy.get("#ops-modal-heading").should("have.text", "Are you sure you want to delete this agreement?");
    cy.get('[data-cy="cancel-action"]').click();
    // close the row
    cy.get("@table-rows").eq(row).find('[data-cy="expand-row"]').click();
};

const deleteAgreementByName = (name) => {
    // get the created agreement
    cy.contains("tbody tr", name).as("agreement-row");
    cy.get("@agreement-row").find('[data-cy="expand-row"]').click();
    // get the first delete button and click
    cy.get(".padding-right-9").find('[data-cy="delete-row"]').click();
    // get the modal and cancel
    cy.get("#ops-modal-heading").should("have.text", "Are you sure you want to delete this agreement?");
    cy.get('[data-cy="cancel-action"]').click();
    // close the row
    cy.get("@agreement-row").find('[data-cy="expand-row"]').click();
};

const deleteAgreementByRowAndFail = (row) => {
    cy.get("tbody").children().as("table-rows").should("exist");
    // get the created agreement
    cy.get("@table-rows").eq(row).find('[data-cy="expand-row"]').click();
    // get the first delete button and click
    cy.get(".padding-right-9").find('[data-cy="delete-row"]').click();
    // get the modal and cancel
    cy.get("#ops-modal-heading").should("not.exist");
    cy.get("@table-rows").eq(row).find('[data-cy="expand-row"]').click();
};

const addAgreement = (agreement) => {
    expect(localStorage.getItem("access_token")).to.exist;

    // create test agreement
    const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
    cy.request({
        method: "POST",
        url: "http://localhost:8080/api/v1/agreements/",
        body: agreement,
        headers: {
            Authorization: bearer_token,
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    });
};

it("should allow to delete an agreement if user created it", () => {
    addAgreement(testAgreement);
    cy.visit("/agreements/");
    deleteAgreementByName(testAgreement.name);
});

it("should allow to delete an agreement if user is project officer", () => {
    deleteAgreementByRow(0);
});
// TODO: Add this this once we can switch users or create a test agreement with a team member
// it("should allow to delete an agreement if user is a team member", () => {
// });

it("should not allow to delete an agreement if user is not project officer or team member or didn't create the agreement", () => {
    deleteAgreementByRowAndFail(3);
});

it("should not allow to delete an agreement if its BLIs are not DRAFT", () => {
    deleteAgreementByRowAndFail(1);
});
