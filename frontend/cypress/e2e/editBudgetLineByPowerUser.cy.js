/// <reference types="cypress" />
import { testLogin, terminalLog } from "./utils";
import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Test agreementWorkflow 1",
    display_name: "E2E Test agreementWorkflow 1",
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
    proc_shop_fee_percentage: 0.005
};
beforeEach(() => {
    testLogin("power-user");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Power User tests", () => {
    it("can login as a power user", () => {
        cy.visit(`/users/528`);
        cy.get(".usa-card__body").should("contain", "Super User");
        cy.get(".usa-card__body").should("contain", "power.user@email.com");
    });

    it("can edit an CONTRACT agreement budget lines amount", () => {
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
                })
                    .then((response) => {
                        expect(response.status).to.eq(201);
                        expect(response.body.id).to.exist;
                        const bliId = response.body.id;
                        return { agreementId, bliId };
                    })
                    .then(({ agreementId, bliId }) => {
                        cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                        cy.get("#edit").click();
                        cy.get("#servicesComponentSelect").select("1");
                        cy.get("#pop-start-date").type("01/01/2044");
                        cy.get("#pop-end-date").type("01/01/2045");
                        cy.get("[data-cy='add-services-component-btn']").click();
                        cy.get("#description").type("This is a description.");
                        cy.get("tbody").children().as("table-rows").should("have.length", 1);
                        cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                        cy.get("[data-cy='edit-row']").click();
                        cy.get("#allServicesComponentSelect").select("SC1");
                        cy.get("#enteredAmount").clear();
                        cy.get("#enteredAmount").type("2_000_000");
                        cy.get('[data-cy="update-budget-line"]').click();
                        cy.get('[data-cy="continue-btn"]').click();
                        cy.get('[data-cy="alert"]').should("exist");
                        cy.get('[data-cy="alert"]')
                            .should(($alert) => {
                                expect($alert).to.contain(
                                    `The agreement ${testAgreement.display_name} has been successfully updated.`
                                );
                            })
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
        // TODO: verify the updated amount once the backend is ready
    });
});
