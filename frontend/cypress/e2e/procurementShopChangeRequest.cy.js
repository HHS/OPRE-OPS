/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Test Procurement Shop Workflow",
    contract_type: "FIRM_FIXED_PRICE",
    description: "Test Description",
    project_id: 1000,
    product_service_code_id: 1,
    awarding_entity_id: 2,
    project_officer_id: 500,
    alternate_project_officer_id: 523,
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

const testBli = {
    line_description: "SC1",
    comments: "",
    can_id: 504,
    agreement_id: 11,
    amount: 1000000,
    status: BLI_STATUS.PLANNED,
    date_needed: "2044-01-01",
    proc_shop_fee_percentage: 0.0
};

beforeEach(() => {
    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Procurement Shop Change Request", () => {
    it("team member should be able to create a procurement shop CR", () => {
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
            // create BLI
            .then((agreementId) => {
                const bliData = { ...testBli, agreement_id: agreementId };
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
                    const bliId = response.body.id;
                    return { agreementId, bliId };
                });
            })
            .then(({ agreementId }) => {
                cy.visit(`http://localhost:3000/agreements/${agreementId}/?mode=edit`);
                cy.get("#procurement-shop-select").select("4");
                cy.get('[data-cy="continue-btn"]').click();
                cy.get("#ops-modal-heading").should(
                    "contain.text",
                    "Changing the Procurement Shop will impact the fee rate on each budget line. Budget changes requires approval from your Division Director. Do you want to send it to approval?"
                );
                cy.get('[data-cy="confirm-action"]').click();
                cy.get('[data-cy="alert"]').should("exist");
                //NOTE: This alert is for the submitter
                cy.get('[data-cy="alert"]').should(($alert) => {
                    expect($alert).to.contain("Changes Sent to Approval");
                    expect($alert).to.contain(
                        "Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement."
                    );
                    expect($alert).to.contain(
                        "Procurement Shop: Government Contracting Services (GCS) to Interior Business Center (IBC)"
                    );
                    expect($alert).to.contain("Fee Rate: 0% to 4.8%");
                    expect($alert).to.contain("Fee Total: $0 to $48,000.00");
                });
                // NOTE: This alert is for any other users
                cy.visit(`http://localhost:3000/agreements/${agreementId}`);
                cy.get('[data-cy="alert"]').should(($alert) => {
                    expect($alert).to.contain("Changes In Review");
                });
            });
    });
});

describe("Procurement Shop Change Requests at the card level", () => {
    it("Division Director should be able to approve CR at the card level", () => {});
    it("Division Director should be able to decline CR at the card level", () => {});
});

describe.skip("Procurement Shop Change Requests at the card level", () => {
    it("Division Director should be able to approve CR at the agreement level", () => {});
    it("Division Director should be able to decline CR at the agreement level", () => {});
});
