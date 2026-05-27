/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

const TOTAL_BLIS = 11;
const PAGE_SIZE = 10;

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: `E2E CR Pagination ${Date.now()}`,
    contract_type: "FIRM_FIXED_PRICE",
    description: "Test pagination of change requests list",
    service_requirement_type: "NON_SEVERABLE",
    project_id: 1000,
    product_service_code_id: 1,
    awarding_entity_id: 2,
    project_officer_id: 500,
    team_members: [{ id: 520 }, { id: 504 }]
};

// CAN 501 is in a portfolio under division 4 (Dave Director's division)
const baseBli = {
    line_description: "SC1",
    can_id: 501,
    amount: 1_000_000,
    status: BLI_STATUS.DRAFT,
    date_needed: "2044-01-01",
    proc_shop_fee_percentage: 0.005,
    services_component_id: testAgreement.awarding_entity_id
};

describe("Change Requests List - Pagination", () => {
    let agreementId;
    let bliIds = [];
    let budgetTeamToken;

    before(() => {
        // Create agreement and 11 BLIs as budget-team, then patch each DRAFT→PLANNED to create CRs
        testLogin("budget-team");
        cy.then(() => {
            budgetTeamToken = `Bearer ${window.localStorage.getItem("access_token")}`;

            cy.request({
                method: "POST",
                url: "http://localhost:8080/api/v1/agreements/",
                body: { ...testAgreement, name: `E2E CR Pagination ${Date.now()}` },
                headers: { Authorization: budgetTeamToken, "Content-Type": "application/json" }
            }).then((res) => {
                expect(res.status).to.eq(201);
                agreementId = res.body.id;

                // Create TOTAL_BLIS BLIs sequentially then patch each to PLANNED
                const createAndPatch = (remaining, acc) => {
                    if (remaining === 0) return cy.wrap(acc);
                    return cy
                        .request({
                            method: "POST",
                            url: "http://localhost:8080/api/v1/budget-line-items/",
                            body: { ...baseBli, agreement_id: agreementId },
                            headers: { Authorization: budgetTeamToken }
                        })
                        .then((bliRes) => {
                            expect(bliRes.status).to.eq(201);
                            const bliId = bliRes.body.id;
                            return cy
                                .request({
                                    method: "PATCH",
                                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                                    body: { id: bliId, status: BLI_STATUS.PLANNED },
                                    headers: { Authorization: budgetTeamToken }
                                })
                                .then((patchRes) => {
                                    expect(patchRes.status).to.eq(202);
                                    return createAndPatch(remaining - 1, [...acc, bliId]);
                                });
                        });
                };

                createAndPatch(TOTAL_BLIS, []).then((ids) => {
                    bliIds = ids;
                });
            });
        });
    });

    after(() => {
        // Delete BLIs and agreement as system-owner
        testLogin("system-owner");
        cy.then(() => {
            const token = `Bearer ${window.localStorage.getItem("access_token")}`;
            bliIds.forEach((id) => {
                cy.request({
                    method: "DELETE",
                    url: `http://localhost:8080/api/v1/budget-line-items/${id}`,
                    headers: { Authorization: token },
                    failOnStatusCode: false
                });
            });
            cy.request({
                method: "DELETE",
                url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
                headers: { Authorization: token }
            }).then((res) => {
                expect(res.status).to.eq(200);
            });
        });
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("shows 10 change requests on page 1 and 1 change request on page 2", () => {
        // Log in as division director (Dave Director, division 4)
        testLogin("division-director");
        cy.visit("/agreements?filter=change-requests");

        // Intercept the first page request
        cy.intercept("GET", "**/change-requests/?*limit=10&offset=0*").as("page1");

        // Wait for page 1 to load and assert 10 items in response
        cy.wait("@page1").then((interception) => {
            expect(interception.response.statusCode).to.eq(200);
            const body = interception.response.body;
            expect(body.count).to.be.at.least(TOTAL_BLIS);
            expect(body.data.length).to.eq(PAGE_SIZE);
        });

        // Pagination nav should be visible
        cy.get("nav[aria-label='Pagination']").should("exist");
        cy.get("button.usa-current").should("contain", "1");

        // Intercept the page 2 request before clicking
        cy.intercept("GET", "**/change-requests/?*limit=10&offset=10*").as("page2");

        // Click to page 2
        cy.get("button[aria-label='Page 2']").click();

        // Wait for page 2 response and assert exactly 1 item
        cy.wait("@page2").then((interception) => {
            expect(interception.response.statusCode).to.eq(200);
            const body = interception.response.body;
            expect(body.data.length).to.eq(1);
        });

        // Current page indicator should show 2
        cy.get("button.usa-current").should("contain", "2");
    });
});
