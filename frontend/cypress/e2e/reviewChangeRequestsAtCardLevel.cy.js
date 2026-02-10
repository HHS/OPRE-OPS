/// <reference types="cypress" />

import {BLI_STATUS} from "../../src/helpers/budgetLines.helpers";
import {terminalLog, testLogin} from "./utils";

let testAgreement;
let testBli;

beforeEach(() => {
    testAgreement = {
        agreement_type: "CONTRACT",
        agreement_reason: "NEW_REQ",
        name: `E2E Review CRs Card Level ${Date.now()}`,
        description: "Test Description",
        project_id: 1000,
        service_requirement_type: "NON_SEVERABLE",
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

    testBli = {
        line_description: "SC1",
        comments: "",
        can_id: 504,
        agreement_id: 11,
        amount: 1000000,
        status: BLI_STATUS.DRAFT,
        date_needed: "2044-01-01",
        proc_shop_fee_percentage: 0.005,
        services_component_id: testAgreement["awarding_entity_id"]
    };

    testLogin("budget-team");
    cy.visit(`/`);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});
describe("Review Change Requests at Card Level", () => {
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
                const bliData = {...testBli, agreement_id: agreementId};
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
                    return {agreementId, bliId};
                });
            })
            // submit PATCH CR for approval via REST
            .then(({agreementId, bliId}) => {
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
                    return {agreementId, bliId};
                });
            })
            // test interactions
            .then(({agreementId, bliId}) => {
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
                        // hover over first card
                        cy.get("[data-cy='review-card']").first().trigger("mouseover");
                        // click on button id approve
                        cy.get("#approve").click();
                        // usa-modal__content class should exist
                        cy.get(".usa-modal__content").should("exist");
                        // should contain Are you sure you want to approve this status change to Planned Status? This will subtract the amounts from the FY budget.
                        cy.get(".usa-modal__content").contains(/status change to Planned Status\?/);
                        // click on button data-cy confirm-action
                        cy.get("[data-cy='confirm-action']").click();
                        cy.get(".usa-alert__body").contains(/changes approved/i);
                        cy.get("[data-cy='close-alert']").click();
                        cy.get("[data-cy='review-card']").should("not.exist");
                        // verify agreement history
                        cy.visit(`/agreements/${agreementId}`);
                        cy.get(".usa-breadcrumb__list > :nth-child(3)").should("have.text", testAgreement.name);
                        cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
                        cy.get('[data-cy="agreement-history-container"]').should("exist");
                        cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
                        cy.get('[data-cy="agreement-history-list"]').should("exist");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).should("exist");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).contains(/Status Change to Planned Approved/);
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]'
                        ).should("exist");
                        cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]')
                            .should(
                                "have.text",
                                `Dave Director approved the status change on BL ${bliId} from Draft to Planned as requested by Budget Team.`
                            )
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
                const bliData = {...updatedBLIToPlanned, agreement_id: agreementId};
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
                    return {agreementId, bliId};
                });
            })
            // submit PATCH CR for approval via REST
            .then(({agreementId, bliId}) => {
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
                    return {agreementId, bliId};
                });
            })
            // test interactions
            .then(({bliId}) => {
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
                        // hover over first card
                        cy.get("[data-cy='review-card']").first().trigger("mouseover");
                        // click on button id approve
                        cy.get("#approve").click();
                        // usa-modal__content class should exist
                        cy.get(".usa-modal__content").should("exist");
                        // should contain Are you sure you want to approve this status change to Executing Status? This will subtract the amounts from the FY budget.
                        cy.get(".usa-modal__content").contains(/status change to Executing Status\?/);
                        // click on button data-cy confirm-action
                        cy.get("[data-cy='confirm-action']").click();
                        cy.get(".usa-alert__body").contains(/changes approved/i);
                        cy.get("[data-cy='close-alert']").click();
                        cy.get("[data-cy='review-card']")
                            .should("not.exist")
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
    it("review Budget Change Amount change", () => {
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
                const bliData = {...updatedBLIToPlanned, agreement_id: agreementId};
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
                    return {agreementId, bliId};
                });
            })
            // submit PATCH CR for approval via REST
            .then(({agreementId, bliId}) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                    body: {
                        id: bliId,
                        amount: 2000000,
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
                    return {agreementId, bliId};
                });
            })
            // test interactions
            .then(({agreementId, bliId}) => {
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
                        cy.get("[data-cy='review-card']").contains(/amount/i);
                        cy.get("[data-cy='review-card']").contains("$2,000,000.00");
                        // hover over first card
                        cy.get("[data-cy='review-card']").first().trigger("mouseover");
                        // click on button id approve
                        cy.get("#approve").click();
                        // usa-modal__content class should exist
                        cy.get(".usa-modal__content").should("exist");
                        // Are you sure you want to approve this budget change? The agreement will be updated after your approval.
                        cy.get(".usa-modal__content").contains(/approve this budget change\?/);
                        // click on button data-cy confirm-action
                        cy.get("[data-cy='confirm-action']").click();
                        cy.get(".usa-alert__body").contains(/changes approved/i);
                        cy.get("[data-cy='close-alert']").click();
                        cy.get("[data-cy='review-card']").should("not.exist");
                        // verify agreement history
                        cy.visit(`/agreements/${agreementId}`);
                        cy.get(".usa-breadcrumb__list > :nth-child(3)").should("have.text", testAgreement.name);
                        cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
                        cy.get('[data-cy="agreement-history-container"]').should("exist");
                        cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
                        cy.get('[data-cy="agreement-history-list"]').should("exist");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).should("exist");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).contains(/Budget Change to Amount Approved/);
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]'
                        ).should("exist");
                        cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]')
                            .should(
                                "have.text",
                                `Dave Director approved the budget change on BL ${bliId} from $1,000,000.00 to $2,000,000.00 as requested by Budget Team.`
                            )
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
    it("review Budget Change CAN change", () => {
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
                const bliData = {...updatedBLIToPlanned, agreement_id: agreementId};
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
                    return {agreementId, bliId};
                });
            })
            // submit PATCH CR for approval via REST
            .then(({agreementId, bliId}) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                    body: {
                        id: bliId,
                        can_id: 502,
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
                    return {agreementId, bliId};
                });
            })
            // test interactions
            .then(({agreementId, bliId}) => {
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
                        cy.get("[data-cy='review-card']").contains(/can/i);
                        cy.get("[data-cy='review-card']").contains("G99PHS9");
                        // hover over first card
                        cy.get("[data-cy='review-card']").first().trigger("mouseover");
                        // click on button id approve
                        cy.get("#approve").click();
                        // usa-modal__content class should exist
                        cy.get(".usa-modal__content").should("exist");
                        // Are you sure you want to approve this budget change? The agreement will be updated after your approval.
                        cy.get(".usa-modal__content").contains(/approve this budget change\?/);
                        // click on button data-cy confirm-action
                        cy.get("[data-cy='confirm-action']").click();
                        cy.get(".usa-alert__body").contains(/changes approved/i);
                        cy.get("[data-cy='close-alert']").click();
                        cy.get("[data-cy='review-card']").should("not.exist");
                        // verify agreement history
                        cy.visit(`/agreements/${agreementId}`);
                        cy.get(".usa-breadcrumb__list > :nth-child(3)").should("have.text", testAgreement.name);
                        cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
                        cy.get('[data-cy="agreement-history-container"]').should("exist");
                        cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
                        cy.get('[data-cy="agreement-history-list"]').should("exist");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).should("exist");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).contains(/Budget Change to CAN Approved/);
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]'
                        ).should("exist");
                        cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]')
                            .should(
                                "have.text",
                                `Dave Director approved the budget change on BL ${bliId} from CAN G994426 to CAN G99PHS9 as requested by Budget Team.`
                            )
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
    it("review Budget Change ObligateBy Needed change", () => {
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
                const bliData = {...updatedBLIToPlanned, agreement_id: agreementId};
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
                    return {agreementId, bliId};
                });
            })
            // submit PATCH CR for approval via REST
            .then(({agreementId, bliId}) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                    body: {
                        id: bliId,
                        date_needed: "2048-11-15",
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
                    return {agreementId, bliId};
                });
            })
            // test interactions
            .then(({agreementId, bliId}) => {
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
                        cy.get("[data-cy='review-card']").contains(/obligate by date/i);
                        cy.get("[data-cy='review-card']").contains("11/15/2048");
                        // hover over first card
                        cy.get("[data-cy='review-card']").first().trigger("mouseover");
                        // click on button id approve
                        cy.get("#approve").click();
                        // usa-modal__content class should exist
                        cy.get(".usa-modal__content").should("exist");
                        // Are you sure you want to approve this budget change? The agreement will be updated after your approval.
                        cy.get(".usa-modal__content").contains(/approve this budget change\?/);
                        // click on button data-cy confirm-action
                        cy.get("[data-cy='confirm-action']").click();
                        cy.get(".usa-alert__body").contains(/changes approved/i);
                        cy.get("[data-cy='close-alert']").click();
                        cy.get("[data-cy='review-card']").should("not.exist");
                        // verify agreement history
                        cy.visit(`/agreements/${agreementId}`);
                        cy.get(".usa-breadcrumb__list > :nth-child(3)").should("have.text", testAgreement.name);
                        cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
                        cy.get('[data-cy="agreement-history-container"]').should("exist");
                        cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
                        cy.get('[data-cy="agreement-history-list"]').should("exist");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).should("exist");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).contains(/Budget Change to Obligate By Approved/);
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]'
                        ).should("exist");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]'
                        ).should(
                            "have.text",
                            `Dave Director approved the budget change on BL ${bliId} from Obligate By on 01/01/2044 to 11/15/2048 as requested by Budget Team.`
                        );
                        cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]')
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
