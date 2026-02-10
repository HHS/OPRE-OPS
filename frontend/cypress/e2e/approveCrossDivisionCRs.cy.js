/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

let testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Approve Cross Division CRs",
    description: "Test Description",
    project_id: 1000,
    product_service_code_id: 1,
    service_requirement_type: "NON_SEVERABLE",
    awarding_entity_id: 2,
    project_officer_id: 500,
    team_members: [
        {
            id: 520
        },
        {
            id: 504
        }
    ],
    notes: "Test Notes"
};

const testBLIWithinDivision = {
    line_description: "SC1",
    comments: "",
    can_id: 504, //"G994426"
    agreement_id: 11,
    amount: 1_000_000,
    status: BLI_STATUS.DRAFT,
    date_needed: "2044-01-01",
    proc_shop_fee_percentage: 0.005,
    services_component_id: testAgreement["awarding_entity_id"]
};

const testBLIOutsideDivision = {
    line_description: "SC1",
    comments: "",
    can_id: 502, //"G99PHS9"
    agreement_id: 11,
    amount: 9_999_999,
    status: BLI_STATUS.DRAFT,
    date_needed: "2044-01-01",
    proc_shop_fee_percentage: 0.005,
    services_component_id: testAgreement["awarding_entity_id"]
};

beforeEach(() => {
    // append a unique identifier to the agreement name to avoid conflicts
    const uniqueId = Date.now();
    testAgreement.name = `E2E Approve Cross Division CRs ${uniqueId}`;

    testLogin("budget-team");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Approve Cross Division Change Requests", () => {
    it("should handle change requests outside division", () => {
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
        })
            .then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body.id).to.exist;
                const agreementId = response.body.id;
                return agreementId;
            })
            // create BLI WITHIN division
            .then((agreementId) => {
                const bliData = { ...testBLIWithinDivision, agreement_id: agreementId };
                cy.request({
                    method: "POST",
                    url: "http://localhost:8080/api/v1/budget-line-items/",
                    body: bliData,
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(201);
                    expect(response.body.id).to.exist;
                    const bliId1 = response.body.id;

                    // Create the second BLI (outside division)
                    const bliData2 = { ...testBLIOutsideDivision, agreement_id: agreementId };
                    cy.request({
                        method: "POST",
                        url: "http://localhost:8080/api/v1/budget-line-items/",
                        body: bliData2,
                        headers: {
                            Authorization: bearer_token,
                            Accept: "application/json"
                        }
                    }).then((response2) => {
                        expect(response2.status).to.eq(201);
                        expect(response2.body.id).to.exist;
                        const bliId2 = response2.body.id;
                        return { agreementId, bliId1, bliId2 };
                    });
                });
            })
            // submit PATCH CR for approval via REST
            .then(({ agreementId, bliId1, bliId2 }) => {
                // Submit PATCH for first BLI
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId1}`,
                    body: {
                        id: bliId1,
                        status: BLI_STATUS.PLANNED,
                        requestor_notes: "Test requestor notes for BLI 1"
                    },
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                })
                    .then((response) => {
                        expect(response.status).to.eq(202);
                        expect(response.body.id).to.exist;

                        // Submit PATCH for second BLI
                        return cy.request({
                            method: "PATCH",
                            url: `http://localhost:8080/api/v1/budget-line-items/${bliId2}`,
                            body: {
                                id: bliId2,
                                status: BLI_STATUS.PLANNED,
                                requestor_notes: "Test requestor notes for BLI 2"
                            },
                            headers: {
                                Authorization: bearer_token,
                                Accept: "application/json"
                            }
                        });
                    })
                    .then((response) => {
                        expect(response.status).to.eq(202);
                        expect(response.body.id).to.exist;
                        return { agreementId, bliId1, bliId2 };
                    });
            })

            // test interactions
            .then(({ agreementId, bliId1, bliId2 }) => {
                cy.contains("Sign-Out")
                    .click()
                    .then(() => {
                        localStorage.clear();
                        expect(localStorage.getItem("access_token")).to.not.exist;
                        testLogin("division-director");
                    })
                    .then(() => {
                        cy.visit("/agreements?filter=change-requests").wait(1000);
                        // see if there are any review cards
                        cy.get("[data-cy='review-card']").should("exist").contains("Status Change");
                        // nav element with the role navigation should contain text 1
                        cy.get('[role="navigation"]').contains("1");
                        cy.get("[data-cy='review-card']").contains(/planned/i);
                        // hover over the review card
                        cy.get("[data-cy='review-card']").trigger("mouseover");
                        // click on button data-cy approve-agreement
                        cy.get("[data-cy='approve-agreement']").click();
                        // get h1 to have content Approval for Status Change - Planned
                        cy.get("h1").contains(/approval for status change - planned/i);
                        // get content in review-card to see if it exists and contains planned, status and amount
                        // get content in review-card to see if it exists and contains planned, status and amount
                        cy.get("[data-cy='review-card']").should("exist");
                        // Add this new check to ensure there is exactly one review card
                        cy.get("[data-cy='review-card']").should("have.length", 1);
                        cy.get("[data-cy='review-card']").contains(/draft/i);
                        cy.get("[data-cy='review-card']").contains(/planned/i);
                        cy.get("[data-cy='review-card']").contains(/status/i);
                        cy.get("[data-cy='review-card']").contains(/total/i);
                        cy.get("[data-cy='review-card']").contains("$1,000,000.00");
                        // check summary cards
                        // get summary card with data-cy currency-summary-card
                        cy.get("[data-cy='currency-summary-card']").should("exist");
                        cy.get("[data-cy='currency-summary-card']").contains("$ 1,000,000.00");
                        cy.get('[data-cy="button-toggle-After Approval"]').first().click();
                        cy.get("[data-cy='currency-summary-card']").contains("$ 0");
                        cy.get('[data-cy="button-toggle-After Approval"]').first().click();
                        //class accordion__content contains a paragraph that contains the text planned status change
                        cy.get(".usa-accordion__content").contains("planned status changes");
                        // section BLs not associated with a Services Component should have a table
                        cy.get(".usa-table").should("exist");
                        // table should contains a table item  with text PLANNED and css class table-item-diff
                        cy.get(".usa-table").contains("In Review");
                        cy.get(".table-item-diff").contains("Planned");
                        cy.get('[data-cy="button-toggle-After Approval"]').first().click();
                        cy.get(".table-item-diff").contains("Draft");
                        // click on checkbox with id approve-confirmation
                        cy.get(".usa-checkbox__label").click();
                        cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
                        cy.get('[data-cy="send-to-approval-btn"]').click();
                        cy.get("#ops-modal-heading").contains(/approve this status change to planned status?/i);
                        // Intercept the change request approval API call
                        cy.intercept("PATCH", "/api/v1/change-requests/").as("approveChangeRequest");
                        cy.get('[data-cy="confirm-action"]').click();
                        // Wait for the API request to complete before checking the alert
                        cy.wait("@approveChangeRequest");
                        cy.get(".usa-alert__body").should("contain", "Changes Approved");
                        cy.get(".usa-alert__body").should("contain", testAgreement.name);
                        cy.get(".usa-alert__body").should("contain", `BL ${bliId1} Status: Draft to Planned`);
                        cy.get("[data-cy='close-alert']").click();
                        cy.get("[data-cy='review-card']").should("not.exist");
                        // nav element should not contain the text 1
                        cy.get('[role="navigation"]').should("not.contain", "1");
                        // verify agreement history
                        cy.visit(`/agreements/${agreementId}`);
                        checkAgreementHistory();
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).contains(/Status Change to Planned Approved/);
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]'
                        ).should("exist");
                        cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]')
                            .should(
                                "have.text",
                                `Dave Director approved the status change on BL ${bliId1} from Draft to Planned as requested by Budget Team.`
                            )
                            // TODO: add more tests
                            .then(() => {
                                // Delete first BLI
                                cy.request({
                                    method: "DELETE",
                                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId1}`,
                                    headers: {
                                        Authorization: bearer_token,
                                        Accept: "application/json"
                                    }
                                }).then((response) => {
                                    expect(response.status).to.eq(200);

                                    // Delete second BLI
                                    cy.request({
                                        method: "DELETE",
                                        url: `http://localhost:8080/api/v1/budget-line-items/${bliId2}`,
                                        headers: {
                                            Authorization: bearer_token,
                                            Accept: "application/json"
                                        }
                                    }).then((response) => {
                                        expect(response.status).to.eq(200);
                                    });
                                });
                            })
                            .then(() => {
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
});

const checkAgreementHistory = () => {
    cy.get(".usa-breadcrumb__list > :nth-child(3)").should("have.text", testAgreement.name);
    cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
    cy.get('[data-cy="agreement-history-container"]').should("exist");
    cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
    cy.get('[data-cy="agreement-history-list"]').should("exist");
    cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]').should(
        "exist"
    );
};
