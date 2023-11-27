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
    status: "UNDER_REVIEW",
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
                expect(response.body.id).to.exist;
                const bliId = response.body.id;
                return { agreementId, bliId };
            });
        })
        .then(({ agreementId, bliId }) => {
            cy.visit("/agreements?filter=for-approval");
            cy.get(":nth-child(1) > .margin-0").should("have.text", "For Approval");
            cy.get("tbody").children().should("have.length.at.least", 1);
            cy.get("tbody tr").first().trigger("mouseover");
            cy.get("[data-cy='go-to-approve-row']").first().should("exist");
            cy.get("[data-cy='go-to-approve-row']")
                .first()
                .should("not.be.disabled")
                .then(() => {
                    return { agreementId, bliId };
                });
        })
        .then(({ agreementId, bliId }) => {
            cy.request({
                method: "PATCH",
                url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                body: { status: "DRAFT" },
                headers: {
                    Authorization: bearer_token,
                    Accept: "application/json"
                }
            }).then((response) => {
                expect(response.status).to.eq(200);
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
    // .then(({ agreementId, bliId }) => {
    //     cy.visit("/agreements?filter=for-approval");
    //     cy.get(":nth-child(1) > .margin-0").should("have.text", "For Approval");
    // });
});
