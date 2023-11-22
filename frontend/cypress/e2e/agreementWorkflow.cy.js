/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "Test Contract",
    description: "Test Description",
    research_project_id: 1,
    product_service_code_id: 1,
    procurement_shop_id: 1,
    incumbent: "Test Vendor",
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

// afterEach(() => {
//     cy.injectAxe();
//     cy.checkA11y(null, null, terminalLog);
// });

it("agreement for approval", () => {
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
                return agreementId;
            });
        })
        .then((agreementId) => {
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

    // cy.request({
    //     method: "DELETE",
    //     url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
    //     headers: {
    //         Authorization: bearer_token,
    //         Accept: "application/json"
    //     }
    // }).then((response) => {
    //     expect(response.status).to.eq(200);
    // });
    //
    // cy.request("GET", myUrl)
    //     .its("body")
    //     .then((res) => cy.request("GET", res).its("body"))
    //     .then((subRes) => cy.request("GET", subRes).its("body"))
    //     .then((subSubRes) => {
    //         expect(subSubRes, myMessage).to.eq(myEvaluation);
    //     });
});
