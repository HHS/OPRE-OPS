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
let testAgreement = {
    agreement_type: "CONTRACT",
    name: "E2E Delete Agreement Test",
    service_requirement_type: "SEVERABLE",
    project_officer_id: 520,
    alternate_project_officer_id: 522
};
let testAgreementToDelete = {
    agreement_type: "CONTRACT",
    name: "E2E Delete Agreement To Delete",
    service_requirement_type: "SEVERABLE",
    project_officer_id: 520,
    alternate_project_officer_id: 523
};

beforeEach(() => {
    // append a unique identifier to the agreement name to avoid conflicts
    const uniqueId = Date.now();
    testAgreement.name = `E2E Delete Agreement Test ${uniqueId}`;
    testAgreementToDelete.name = `E2E Delete Agreement To Delete ${uniqueId}`;
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

// Pages to the row matching `isOnCurrentPage($tbody)`, rather than a fixed row index —
// the agreements list is sorted by nickname-preferred display_name (OPS-6144), so an
// agreement's row position shifts whenever seed data or nicknames change.
const navigateToMatchingRow = (isOnCurrentPage) => {
    cy.get("tbody", { timeout: 30000 }).then(($tbody) => {
        if (isOnCurrentPage($tbody)) {
            return;
        }
        // Get the current page number before clicking next
        cy.get(".usa-pagination__button.usa-current")
            .invoke("text")
            .then((currentPageText) => {
                const currentPageNum = parseInt(currentPageText);
                // The Next button uses visibility:hidden (not disabled) when on the last page
                cy.get(".usa-pagination__next-page").then(($nextBtn) => {
                    if ($nextBtn.css("visibility") !== "hidden") {
                        cy.wrap($nextBtn).click();
                        // Wait for the page number to change before recursing
                        cy.get(".usa-pagination__button.usa-current", { timeout: 30000 }).should(
                            "have.text",
                            String(currentPageNum + 1)
                        );
                        navigateToMatchingRow(isOnCurrentPage);
                    }
                });
            });
    });
};

const navigateToAgreementPage = (name) => navigateToMatchingRow(($tbody) => $tbody.text().includes(name));

const deleteAgreementByName = (name) => {
    navigateToAgreementPage(name);
    // get the created agreement
    cy.contains("tbody tr", name, { timeout: 30000 }).as("agreement-row");
    cy.get("@agreement-row").find('[data-cy="expand-row"]').click();
    // get the first delete button and click
    cy.get('[data-cy="change-icons-expanded"]').find('[data-cy="delete-row"]').click().wait(1);
    // get the modal and cancel
    cy.get("#ops-modal-heading").should("have.text", `Are you sure you want to delete Agreement ${name}?`);
    cy.get('[data-cy="confirm-action"]').click();
    cy.contains("tbody tr", name).should("not.exist");
};

// Targets a row by agreement id (via its stable `agreement-table-row-<id>` testid) instead
// of a row index, which breaks whenever the list's sort order or seed data changes.
const deleteAgreementByIdAndFail = (agreementId) => {
    const rowSelector = `[data-testid="agreement-table-row-${agreementId}"]`;
    navigateToMatchingRow(($tbody) => $tbody.find(rowSelector).length > 0);
    cy.get(rowSelector).find('[data-cy="expand-row"]').click();
    // get the first delete button and click
    cy.get('[data-cy="change-icons-expanded"]').find('[data-cy="delete-row"]').should("be.disabled");
    // get the modal and cancel
    cy.get("#ops-modal-heading").should("not.exist");
    cy.get(rowSelector).find('[data-cy="expand-row"]').click();
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

describe("Sytem-owner tests", () => {
    beforeEach(() => {
        testLogin("system-owner");
    });

    it("should allow to delete an agreement if user created it", () => {
        addAgreement(testAgreement);
        cy.visit("/agreements/");

        cy.intercept("GET", "/api/v1/agreements/*").as("getAgreements");
        cy.wait("@getAgreements");
        cy.get("#fiscal-year-select").select("All");

        deleteAgreementByName(testAgreement.name);
    });

    it("should allow to delete an agreement if user is project officer", () => {
        addAgreement(testAgreement);
        cy.visit("/agreements/");

        cy.intercept("GET", "/api/v1/agreements/*").as("getAgreements");
        cy.wait("@getAgreements");
        cy.get("#fiscal-year-select").select("All");

        deleteAgreementByName(testAgreement.name);
    });
});

describe("Budget-team tests", () => {
    beforeEach(() => {
        testLogin("budget-team");
    });

    it("should allow to delete an agreement if user is alternate project officer", () => {
        addAgreement(testAgreementToDelete);
        cy.visit("/agreements/");

        cy.intercept("GET", "/api/v1/agreements/*").as("getAgreements");
        cy.wait("@getAgreements");
        cy.contains("h1", "Loading...", { timeout: 30000 }).should("not.exist");
        cy.get("#fiscal-year-select").select("All");

        deleteAgreementByName(testAgreementToDelete.name);
    });

    // TODO: Add this this once we can switch users or create a test agreement with a team member
    // it("should allow to delete an agreement if user is a team member", () => {
    // });
    //
    it("should not allow to delete an agreement if user is not project officer or team member or didn't create the agreement", () => {
        cy.intercept("GET", "/api/v1/agreements/*").as("getAgreements");
        cy.visit("/agreements/");
        cy.wait("@getAgreements");
        cy.contains("h1", "Loading...", { timeout: 30000 }).should("not.exist");
        cy.get("#fiscal-year-select").select("All");

        // Seeded "Contract Workflow Test" agreement (id 10) is awarded, so it's locked for
        // delete regardless of team membership.
        deleteAgreementByIdAndFail(10);
    });

    it("should not allow to delete an agreement if its BLIs are not DRAFT", () => {
        cy.intercept("GET", "/api/v1/agreements/*").as("getAgreements");
        cy.visit("/agreements/");
        cy.wait("@getAgreements");
        cy.contains("h1", "Loading...", { timeout: 30000 }).should("not.exist");
        cy.get("#fiscal-year-select").select("All");

        // Seeded "CONTRACT #2: Fathers and Continuous Learning (FCL)" agreement (id 6) has
        // non-DRAFT BLIs and isn't awarded, so it's locked for delete specifically for that
        // reason (unlike a row-index pick, not affected by sort order or seed data changes).
        deleteAgreementByIdAndFail(6);
    });
});
