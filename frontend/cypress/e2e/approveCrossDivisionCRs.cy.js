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

const DIVISION_DIRECTOR_OIDC_ID = "00000000-0000-1111-a111-000000000020";

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
    const clearPendingChangeRequestsForDivisionDirector = (preserveChangeRequestIds = []) => {
        const divisionDirectorToken = `Bearer ${window.localStorage.getItem("access_token")}`;

        return cy
            .request({
                method: "GET",
                url: `http://localhost:8080/api/v1/users/?oidc_id=${DIVISION_DIRECTOR_OIDC_ID}`,
                headers: {
                    Authorization: divisionDirectorToken,
                    Accept: "application/json"
                }
            })
            .then((userResponse) => {
                const divisionDirectorUserId = userResponse.body?.[0]?.id;
                if (!divisionDirectorUserId) {
                    return;
                }

                return cy
                    .request({
                        method: "GET",
                        url: `http://localhost:8080/api/v1/change-requests/?userId=${divisionDirectorUserId}`,
                        headers: {
                            Authorization: divisionDirectorToken,
                            Accept: "application/json"
                        }
                    })
                    .then((changeRequestsResponse) => {
                        const pendingChangeRequestIds = (changeRequestsResponse.body || [])
                            .filter((changeRequest) => changeRequest.status === "IN_REVIEW")
                            .filter((changeRequest) => !preserveChangeRequestIds.includes(changeRequest.id))
                            .map((changeRequest) => changeRequest.id);

                        if (!pendingChangeRequestIds.length) {
                            return;
                        }

                        return cy.wrap(pendingChangeRequestIds).each((changeRequestId) =>
                            cy.request({
                                method: "PATCH",
                                url: "http://localhost:8080/api/v1/change-requests/",
                                body: {
                                    change_request_id: changeRequestId,
                                    action: "REJECT",
                                    reviewer_notes: "E2E cleanup"
                                },
                                headers: {
                                    Authorization: divisionDirectorToken,
                                    Accept: "application/json"
                                }
                            })
                        );
                    });
            });
    };

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
                return cy.request({
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
                    return cy.request({
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
                let crId1;
                // Submit PATCH for first BLI
                return cy.request({
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
                        expect(response.body.change_requests_in_review).to.exist;
                        crId1 = response.body.change_requests_in_review[0]?.id;

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
                        expect(response.body.change_requests_in_review).to.exist;
                        const crId2 = response.body.change_requests_in_review[0]?.id;
                        return { agreementId, bliId1, bliId2, crId1, crId2 };
                    });
            })

            // test interactions
            .then(({ agreementId, bliId1, bliId2, crId1, crId2 }) => {
                return cy
                    .contains("Sign-Out")
                    .click()
                    .then(() => {
                        localStorage.clear();
                        expect(localStorage.getItem("access_token")).to.not.exist;
                        testLogin("division-director");
                    })
                    .then(() => clearPendingChangeRequestsForDivisionDirector([crId1, crId2]))
                    .then(() => {
                        const divisionDirectorBearerToken = `Bearer ${window.localStorage.getItem("access_token")}`;
                        return cy.request({
                            method: "PATCH",
                            url: "http://localhost:8080/api/v1/change-requests/",
                            body: {
                                change_request_id: crId1,
                                action: "APPROVE",
                                reviewer_notes: "approved looks good"
                            },
                            headers: {
                                Authorization: divisionDirectorBearerToken,
                                Accept: "application/json"
                            }
                        });
                    })
                    .then((response) => {
                        expect(response.status).to.eq(200);
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
