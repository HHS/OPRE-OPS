/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

const testAgreements = [
    {
        agreement: 1,
        row: 0,
        created_by: 4,
        project_officer: 1,
        team_members: [1, 4],
        BLIsAllDraft: true,
        shouldDelete: true,
    },
    {
        agreement: 2,
        row: 1,
        created_by: 4,
        project_officer: 1,
        team_members: [1, 4],
        BLIsAllDraft: false,
        shouldDelete: false,
    },
    {
        agreement: 7,
        row: 2,
        created_by: 4,
        project_officer: null,
        team_members: [],
        BLIsAllDraft: false,
        shouldDelete: false,
    },
    {
        agreement: 8,
        row: 3,
        created_by: 4,
        project_officer: null,
        team_members: [],
        BLIsAllDraft: false,
        shouldDelete: false,
    },
    {
        agreement: 3,
        row: 4,
        created_by: 4,
        project_officer: 1,
        team_members: [],
        BLIsAllDraft: 0,
        shouldDelete: true,
    },
    {
        agreement: 4,
        row: 5,
        created_by: 4,
        project_officer: 1,
        team_members: [],
        BLIsAllDraft: 0,
        shouldDelete: true,
    },
    {
        agreement: 5,
        row: 6,
        created_by: 4,
        project_officer: 1,
        team_members: [],
        BLIsAllDraft: 0,
        shouldDelete: true,
    },
    {
        agreement: 6,
        row: 7,
        created_by: 4,
        project_officer: 1,
        team_members: [],
        BLIsAllDraft: 0,
        shouldDelete: true,
    },
];
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

const deleteLastAgreement = () => {
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
};

const deleteAgreementByRow = (row) => {
    cy.get("tbody").children().as("table-rows").should("exist");
    // get the created agreement
    cy.get("@table-rows").eq(row).find('[data-cy="expand-row"]').click();
    // get the first delete button and click
    cy.get(".padding-right-9").find('[data-cy="delete-agreement"]').click();
    // get the modal and cancel
    cy.get("#ops-modal-heading").should("have.text", "Are you sure you want to delete this agreement?");
    cy.get('[data-cy="cancel-action"]').click();
    // close the row
    cy.get("@table-rows").eq(row).find('[data-cy="expand-row"]').click();
};

const deleteAgreementByRowAndFail = (row) => {
    cy.get("tbody").children().as("table-rows").should("exist");
    // get the created agreement
    cy.get("@table-rows").eq(row).find('[data-cy="expand-row"]').click();
    // get the first delete button and click
    cy.get(".padding-right-9").find('[data-cy="delete-agreement"]').click();
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
            Accept: "application/json",
        },
    });
};

it("loads with 9 agreements", () => {
    cy.get("tbody").children().as("table-rows").should("have.length", 9);
});

it("should allow to delete an agreement if user created it", () => {
    cy.get("tbody").children().as("table-rows").should("have.length", 9);
    addAgreement(testAgreement);
    cy.visit("/agreements/");
    deleteLastAgreement();
    cy.get("@table-rows").should("have.length", 9);
});

it("should allow to delete an agreement if user is project officer", () => {
    cy.get("tbody").children().as("table-rows").should("have.length", 9);
    deleteAgreementByRow(0);
    cy.get("@table-rows").should("have.length", 9);
});
// TODO: Add this this once we can switch users or create a test agreement with a team member
// it("should allow to delete an agreement if user is a team member", () => {
// });

it("should not allow to delete an agreement if user is not project officer or team member or didn't create the agreement", () => {
    cy.get("tbody").children().as("table-rows").should("have.length", 9);
    deleteAgreementByRowAndFail(3);
    cy.get("@table-rows").should("have.length", 9);
});

it("should not allow to delete an agreement if its BLIs are not DRAFT", () => {
    cy.get("tbody").children().as("table-rows").should("have.length", 9);
    deleteAgreementByRowAndFail(1);
    cy.get("@table-rows").should("have.length", 9);
});
