/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

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
    name: "Test Contract",
    project_officer_id: 520,
    alternate_project_officer_id: 522
};
const testAgreementToDelete = {
    agreement_type: "CONTRACT",
    name: "Test Delete Contract",
    project_officer_id: 520,
    alternate_project_officer_id: 523
};

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/agreements/");
    cy.wait(1000);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

const deleteAgreementByName = (name) => {
    // get the created agreement
    cy.contains("tbody tr", name).as("agreement-row");
    cy.get("@agreement-row").find('[data-cy="expand-row"]').click();
    // get the first delete button and click
    cy.get(".padding-right-9").find('[data-cy="delete-row"]').click().wait(1);
    // get the modal and cancel
    cy.get("#ops-modal-heading").should("have.text", `Are you sure you want to delete Agreement ${name}?`);
    cy.get('[data-cy="confirm-action"]').click();
    // close the row
    cy.get("@agreement-row").find('[data-cy="expand-row"]').click();
};

const deleteAgreementByRowAndFail = (row) => {
    cy.get("tbody").children().as("table-rows").should("exist");
    // get the created agreement
    cy.get("@table-rows").eq(row).find('[data-cy="expand-row"]').click();
    // get the first delete button and click
    cy.get(".padding-right-9").find('[data-cy="delete-row"]').should("be.disabled");
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

    cy.wait(2000);
    deleteAgreementByName(testAgreement.name);
});

it("should allow to delete an agreement if user is project officer", () => {
    addAgreement(testAgreement);
    cy.visit("/agreements/");

    cy.wait(2000);
    deleteAgreementByName(testAgreement.name);
});

it("should allow to delete an agreement if user is alternate project officer", () => {
    addAgreement(testAgreementToDelete);

    cy.get('[data-cy="sign-out"]').click();
    cy.visit("/").wait(1000);
    testLogin("budget-team");
    cy.visit("/agreements/");

    cy.wait(2000);
    deleteAgreementByName(testAgreementToDelete.name);
});
// TODO: Add this this once we can switch users or create a test agreement with a team member
// it("should allow to delete an agreement if user is a team member", () => {
// });
//
it("should not allow to delete an agreement if user is not project officer or team member or didn't create the agreement", () => {
    deleteAgreementByRowAndFail(3);
});

it("should not allow to delete an agreement if its BLIs are not DRAFT", () => {
    cy.wait(8000);
    deleteAgreementByRowAndFail(1);
});
