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
    amount: 1000000,
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
        // submit for approval (via REST for now, maybe change to UI click through)
        .then(({ agreementId, bliId }) => {
            const workflowSubmitData = {
                budget_line_item_ids: [bliId],
                workflow_action: "DRAFT_TO_PLANNED",
                notes: "E2E Test Notes"
            };
            cy.request({
                method: "POST",
                url: "http://localhost:8080/api/v1/workflow-submit/",
                body: workflowSubmitData,
                headers: {
                    Authorization: bearer_token,
                    Accept: "application/json"
                }
            }).then((response) => {
                expect(response.status).to.eq(201);
                return { agreementId, bliId };
            });
        })
        .then(({ agreementId, bliId }) => {
            cy.visit("/agreements?filter=for-approval");
            cy.get(":nth-child(1) > .margin-0").should("have.text", "For Review");
            cy.get("tbody").children().should("have.length.at.least", 1);
            cy.get("tbody tr").first().trigger("mouseover");
            cy.get("[data-cy='go-to-approve-row']").first().should("exist");
            cy.get("[data-cy='go-to-approve-row']").first().should("not.be.disabled");
            cy.get("[data-cy='go-to-approve-row']").first().click();
            cy.url().should("include", "/agreements/approve/").wait(1000);
            cy.get("[data-cy='decline-approval-btn']").should("exist");
            cy.get("[data-cy='decline-approval-btn']").first().should("not.be.disabled");
            cy.get("[data-cy='decline-approval-btn']").first().click();
            cy.get("#ops-modal-heading").should(
                "have.text",
                "Are you sure you want to decline these budget lines for Planned Status?"
            );
            // find the delete button and click
            cy.get('[data-cy="confirm-action"]').click();
            cy.url().should("eq", Cypress.config().baseUrl + "/agreements");
            cy.get("h1")
                .should("exist")
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
