/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Test agreementWorkflow 1",
    description: "Test Description",
    project_id: 1000,
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
    status: BLI_STATUS.DRAFT,
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
                    return { agreementId, bliId };
                });
            })
            // test interactions
            .then(({ agreementId, bliId }) => {
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
                    return { agreementId, bliId };
                });
            })
            // test interactions
            .then(({ agreementId, bliId }) => {
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
    it("review Budget Change Date Needed change", () => {
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
                        date_needed: "2028-11-15",
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
                cy.visit("/agreements?filter=change-requests").wait(1000);
                // see if there are any review cards
                cy.get("[data-cy='review-card']").should("exist").contains("Budget Change");
                cy.get("[data-cy='review-card']").contains(/date needed/i);
                cy.get("[data-cy='review-card']").contains("11/15/2028");
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