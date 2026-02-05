/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

const waitForAgreementHistory = (agreementId, bearer_token, retries = 20) => {
    const historyUrl = `http://localhost:8080/api/v1/agreement-history/${agreementId}?limit=20&offset=0`;
    return cy
        .request({
            method: "GET",
            url: historyUrl,
            headers: {
                Authorization: bearer_token,
                Accept: "application/json"
            },
            failOnStatusCode: false
        })
        .then((response) => {
            const hasEntries = response.status === 200 && Array.isArray(response.body) && response.body.length > 0;
            if (hasEntries) {
                return;
            }
            if (retries <= 0) {
                expect(response.status).to.eq(200);
                expect(response.body).to.be.an("array").and.have.length.greaterThan(0);
                return;
            }
            cy.wait(1000);
            return waitForAgreementHistory(agreementId, bearer_token, retries - 1);
        });
};

let testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Decline CRs Agreement Level",
    description: "Test Description",
    service_requirement_type: "NON_SEVERABLE",
    project_id: 1000,
    product_service_code_id: 1,
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

const testBli = {
    line_description: "SC1",
    comments: "",
    can_id: 504,
    agreement_id: 11,
    amount: 1_000_000,
    status: BLI_STATUS.DRAFT,
    date_needed: "2044-01-01",
    proc_shop_fee_percentage: 0.005,
    services_component_id: testAgreement["awarding_entity_id"]
};

beforeEach(() => {
    // append a unique identifier to the agreement name to avoid conflicts
    const uniqueId = Date.now();
    testAgreement.name = `E2E Decline CRs Agreement Level ${uniqueId}`;

    testLogin("budget-team");
    cy.visit(`/`);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});
describe("Decline Change Requests at the Agreement Level", () => {
    it("review Status Change DRAFT TO PLANNED", () => {
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
            // submit PATCH CR for approval via REST
            .then(({ agreementId, bliId }) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                    body: {
                        id: bliId,
                        status: BLI_STATUS.PLANNED,
                        requestor_notes: "Test requestor notes"
                    },
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(202);
                    expect(response.body.id).to.exist;
                    const bliId = response.body.id;
                    return { agreementId, bliId };
                });
            })
            // test interactions
            .then(({ agreementId, bliId }) => {
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
                        cy.get("[data-cy='review-card']").contains(/planned/i);
                        // hover over the first review card
                        cy.get("[data-cy='review-card']").first().trigger("mouseover");
                        // click on first button data-cy approve-agreement
                        cy.get("[data-cy='approve-agreement']").first().click();
                        // get h1 to have content Approval for Status Change - Planned
                        cy.get("h1").contains(/approval for status change - planned/i);
                        // get content in review-card to see if it exists and contains planned, status and amount
                        cy.get("[data-cy='review-card']").contains(/draft/i);
                        cy.get("[data-cy='review-card']").contains(/planned/i);
                        cy.get("[data-cy='review-card']").contains(/status/i);
                        cy.get("[data-cy='review-card']").contains(/total/i);
                        cy.get("[data-cy='review-card']").contains("$1,000,000.00");
                        //class accordion__content contains a paragraph that contains the text planned status change
                        cy.get(".usa-accordion__content").contains("planned status changes");
                        cy.get('[data-cy="decline-approval-btn"]').click();
                        cy.get("#ops-modal-heading").contains(/decline this status change to planned status?/i);
                        cy.get('[data-cy="confirm-action"]').click();
                        cy.get(".usa-alert__body").should("contain", "Changes Declined");
                        cy.get("[data-cy='review-card']").should("not.exist");
                        // verify agreement history
                        waitForAgreementHistory(agreementId, bearer_token);
                        cy.visit(`/agreements/${agreementId}`);
                        checkAgreementHistory();
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).contains(/Status Change to Planned Declined/);
                        cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]')
                            .should("exist")
                            // TODO: add more tests
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
    });
    it("review Status Change PLANNED to EXECUTING", () => {
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
                const updatedBLIToPlanned = {
                    ...testBli,
                    status: BLI_STATUS.PLANNED
                };
                const bliData = { ...updatedBLIToPlanned, agreement_id: agreementId };
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
            // submit PATCH CR for approval via REST
            .then(({ agreementId, bliId }) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                    body: {
                        id: bliId,
                        status: BLI_STATUS.EXECUTING,
                        requestor_notes: "Test requestor notes"
                    },
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(202);
                    expect(response.body.id).to.exist;
                    const bliId = response.body.id;
                    return { agreementId, bliId };
                });
            })
            // test interactions
            .then(({ agreementId, bliId }) => {
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
                        cy.get("[data-cy='review-card']").contains(/executing/i);
                        // hover over the first review card
                        cy.get("[data-cy='review-card']").first().trigger("mouseover");
                        // click on first button data-cy approve-agreement
                        cy.get("[data-cy='approve-agreement']").first().click();
                        // get h1 to have content Approval for Status Change - Planned
                        cy.get("h1").contains(/approval for status change - executing/i);
                        // get content in review-card to see if it exists and contains planned, status and amount
                        cy.get("[data-cy='review-card']").contains(/planned/i);
                        cy.get("[data-cy='review-card']").contains(/executing/i);
                        cy.get("[data-cy='review-card']").contains(/status/i);
                        cy.get("[data-cy='review-card']").contains(/total/i);
                        cy.get("[data-cy='review-card']").contains("$1,000,000.00");
                        //class accordion__content contains a paragraph that contains the text planned status change
                        cy.get(".usa-accordion__content").contains("executing status changes");
                        cy.get('[data-cy="decline-approval-btn"]').click();
                        cy.get("#ops-modal-heading").contains(/decline these budget lines for executing status/i);
                        cy.get('[data-cy="confirm-action"]').click();
                        cy.get(".usa-alert__body").should("contain", "Changes Declined");
                        cy.get("[data-cy='review-card']").should("not.exist");
                        // verify agreement history
                        waitForAgreementHistory(agreementId, bearer_token);
                        cy.visit(`/agreements/${agreementId}`);
                        checkAgreementHistory();
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        )
                            .contains(/Status Change to Executing Declined/)
                            // TODO: add more tests
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
                            });
                        // TODO: unable to delete agreement?
                        // .then(() => {
                        //     cy.request({
                        //         method: "DELETE",
                        //         url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
                        //         headers: {
                        //             Authorization: bearer_token,
                        //             Accept: "application/json"
                        //         }
                        //     }).then((response) => {
                        //         expect(response.status).to.eq(200);
                        //     });
                        // });
                    });
            });
    });
    it("review Budget Change change", () => {
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
                const updatedBLIToPlanned = {
                    ...testBli,
                    status: BLI_STATUS.PLANNED
                };
                const bliData = { ...updatedBLIToPlanned, agreement_id: agreementId };
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
            // submit PATCH CR for approval via REST
            .then(({ agreementId, bliId }) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                    body: {
                        id: bliId,
                        amount: 2_000_000,
                        requestor_notes: "Test requestor notes"
                    },
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(202);
                    expect(response.body.id).to.exist;
                    const bliId = response.body.id;
                    return { agreementId, bliId };
                });
            })
            // test interactions
            .then(({ agreementId, bliId }) => {
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
                        cy.get("[data-cy='review-card']").should("exist").contains("Budget Change");
                        cy.get("[data-cy='review-card']").contains(/planned/i);
                        // hover over the first review card
                        cy.get("[data-cy='review-card']").first().trigger("mouseover");
                        // click on first button data-cy approve-agreement
                        cy.get("[data-cy='approve-agreement']").click();
                        // get h1 to have content Approval for
                        cy.get("h1").contains(/approval for budget change/i);
                        // get content in review-card
                        cy.get("[data-cy='review-card']").contains(/planned/i);
                        cy.get("[data-cy='review-card']").contains(/amount/i);
                        cy.get("[data-cy='review-card']").contains("$1,000,000.00");
                        cy.get("[data-cy='review-card']").contains("$2,000,000.00");
                        //class accordion__content contains a paragraph that contains the text planned status change
                        cy.get(".usa-accordion__content").contains("budget changes");
                        cy.get('[data-cy="decline-approval-btn"]').click();
                        cy.get("#ops-modal-heading").contains(/decline this budget change/i);
                        cy.get('[data-cy="confirm-action"]').click();
                        cy.get(".usa-alert__body").should("contain", "Changes Declined");
                        cy.get("[data-cy='review-card']").should("not.exist");
                        // verify agreement history
                        waitForAgreementHistory(agreementId, bearer_token);
                        cy.visit(`/agreements/${agreementId}`);
                        checkAgreementHistory();
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        )
                            .contains(/Budget Change to Amount Declined/)
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
    });
    it("handle cancelling out of approval", () => {
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
                const updatedBLIToPlanned = {
                    ...testBli,
                    status: BLI_STATUS.PLANNED
                };
                const bliData = { ...updatedBLIToPlanned, agreement_id: agreementId };
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
            // submit PATCH CR for approval via REST
            .then(({ agreementId, bliId }) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                    body: {
                        id: bliId,
                        amount: 2_000_000,
                        requestor_notes: "Test requestor notes"
                    },
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(202);
                    expect(response.body.id).to.exist;
                    const bliId = response.body.id;
                    return { agreementId, bliId };
                });
            })
            // test interactions
            .then(({ agreementId, bliId }) => {
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
                        cy.get("[data-cy='review-card']").should("exist").contains("Budget Change");
                        cy.get("[data-cy='review-card']").contains(/planned/i);
                        // hover over the review card
                        cy.get("[data-cy='review-card']").first().trigger("mouseover");
                        // click on button data-cy approve-agreement
                        cy.get("[data-cy='approve-agreement']").first().click();
                        // get h1 to have content Approval for
                        cy.get("h1").contains(/approval for budget change/i);
                        // get content in review-card
                        cy.get("[data-cy='review-card']").contains(/planned/i);
                        cy.get("[data-cy='review-card']").contains(/amount/i);
                        cy.get("[data-cy='review-card']").contains("$1,000,000.00");
                        cy.get("[data-cy='review-card']").contains("$2,000,000.00");
                        //class accordion__content contains a paragraph that contains the text planned status change
                        cy.get(".usa-accordion__content").contains("budget changes");
                        cy.get('[data-cy="cancel-approval-btn"]').click();
                        cy.get("#ops-modal-heading").contains(/are you sure you want to cancel/i);
                        cy.get('[data-cy="confirm-action"]').click();
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
    });
});

const checkAgreementHistory = () => {
    cy.get(".usa-breadcrumb__list > :nth-child(3)").should("contain", testAgreement.name);
    cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
    cy.get('[data-cy="agreement-history-container"]').should("exist");
    cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
    cy.get('[data-cy="agreement-history-list"]', { timeout: 60000 }).should("exist");
    cy.get('[data-cy="agreement-history-list"] > :nth-child(1)', { timeout: 60000 }).should("exist");
    cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]', {
        timeout: 60000
    }).should("exist");
};
