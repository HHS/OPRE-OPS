/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Test agreementWorkflow 1",
    description: "Test Description",
    project_id: 1,
    product_service_code_id: 1,
    procurement_shop_id: 1,
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

const testBli = {
    line_description: "SC1",
    comments: "",
    can_id: 501,
    agreement_id: 11,
    amount: 1000000,
    status: BLI_STATUS.PLANNED,
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

it("BLI Budget Change", () => {
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
        // create Services Component
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
            cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines?mode=edit`);
            cy.get("#servicesComponentSelect").select("1");
            cy.get("#pop-start-date").type("01/01/2024");
            cy.get("#pop-end-date").type("01/01/2025");
            cy.get("#description").type("This is a description.");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("tbody").children().as("table-rows").should("have.length", 1);
            cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
            cy.get("[data-cy='edit-row']").click();
            cy.get("#allServicesComponentSelect").select("SC1");
            cy.get("#enteredAmount").clear();
            cy.get("#enteredAmount").type("2_222_222_222");

            cy.get('[data-cy="update-budget-line"]').click();
            cy.get('[data-cy="continue-btn"]').click();
            cy.get('[data-cy="confirm-action"]').click();
            cy.get('[data-cy="alert"]').should("exist");
            cy.get('[data-cy="alert"]').contains("$2,222,222,222.00");
            cy.visit("/agreements?filter=change-requests").wait(1000);
            // see if there are any review cards
            cy.get("[data-cy='review-card']")
                .should("exist")
                .then(() => {
                    cy.request({
                        method: "DELETE",
                        url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                        headers: {
                            Authorization: bearer_token,
                            Accept: "application/json"
                        }
                    }).then((response) => {
                        expect(response.status).to.eq(200);
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
