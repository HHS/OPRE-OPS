/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Test agreementWorkflow 1",
    description: "Test Description",
    project_id: 1,
    product_service_code_id: 1,
    procurement_shop_id: 1,
    project_officer_id: 1,
    team_members: [
        {
            id: 21
        },
        {
            id: 5
        }
    ],
    notes: "Test Notes"
};
const testBli = {
    line_description: "SC1",
    comments: "",
    can_id: 1,
    agreement_id: 11,
    amount: 1_000_000,
    status: "DRAFT",
    date_needed: "2025-1-01",
    proc_shop_fee_percentage: 0.005
};

beforeEach(() => {
    testLogin("admin");
    cy.visit(`/`);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});
// TODO: Update when we are able to test the UI for the approval process
it("agreement (BLI) workflow for approval then rejection", () => {
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
        .then(({ agreementId, bliId }) => {
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("[data-cy=bli-tab-continue-btn]").click();
            cy.get('[type="radio"]').first().check({ force: true });
            cy.get("#check-all").check({ force: true }).wait(1);
            cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
            cy.get('[data-cy="send-to-approval-btn"]').click();
        })
        .then(({ agreementId, bliId }) => {
            cy.visit("/agreements?filter=change-requests").wait(1000);
            // TODO: add approve tests for change requests
            cy.get('[data-cy="review-card"]')
                .should("have.length", 1)

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
