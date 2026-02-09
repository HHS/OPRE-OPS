/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

let testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Procurement Shop CR",
    contract_type: "FIRM_FIXED_PRICE",
    description: "Test Description",
    project_id: 1000,
    product_service_code_id: 1,
    service_requirement_type: "NON_SEVERABLE",
    awarding_entity_id: 2, // GCS
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
    proc_shop_fee_percentage: 0.0,
    services_component_id: testAgreement["awarding_entity_id"]
};

beforeEach(() => {
    // append a unique identifier to the agreement name to avoid conflicts
    const uniqueId = Date.now();
    testAgreement.name = `E2E Procurement Shop CR ${uniqueId}`;

    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Procurement Shop Change Request", () => {
    it("team member should be able to create a procurement shop CR", () => {
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
            .then(({ agreementId }) => {
                cy.visit(`http://localhost:3000/agreements/${agreementId}/?mode=edit`);
                cy.get("#procurement-shop-select").select("4");
                cy.get('[data-cy="continue-btn"]').click();
                cy.get("#ops-modal-heading").should(
                    "contain.text",
                    "Changing the Procurement Shop will impact the fee rate on each budget line. Budget changes require approval from your Division Director. Do you want to send it to approval?"
                );
                cy.get('[data-cy="confirm-action"]').click();
                cy.get('[data-cy="alert"]').should("exist");
                // NOTE: This alert is for the submitter
                cy.get('[data-cy="alert"]').should(($alert) => {
                    expect($alert).to.contain("Changes Sent to Approval");
                    expect($alert).to.contain(
                        "Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement."
                    );
                    expect($alert).to.contain(
                        "Procurement Shop: Government Contracting Services (GCS) to Interior Business Center (IBC)"
                    );
                    expect($alert).to.contain("Fee Rate: 0% to 4.8%");
                    expect($alert).to.contain("Fee Total: $0 to $48,000.00");
                });
                // NOTE: This alert is for any other users
                cy.visit(`http://localhost:3000/agreements/${agreementId}`);
                cy.get('[data-cy="alert"]').should(($alert) => {
                    expect($alert).to.contain("Changes In Review");
                });
                checkAgreementHistory();
                cy.get(
                    '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                ).should("have.text", "Change to Procurement Shop In Review");
                cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]').should(
                    "have.text",
                    "System Owner requested a change on the Procurement Shop from GCS to IBC and it's currently In Review for approval. This would change the fee rate from 0% to 4.80% and the fee total from $0.00 to $48,000.00."
                );
            });
    });
    it("Team members should be able to make procurement shop change when all BLIs are DRAFT", () => {
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
                const draftBLI = { ...testBli, status: BLI_STATUS.DRAFT };
                const bliData = { ...draftBLI, agreement_id: agreementId };
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
                cy.visit(`http://localhost:3000/agreements/${agreementId}/?mode=edit`);
                cy.get("#procurement-shop-select").select("4"); // IBC
                cy.get('[data-cy="continue-btn"]').click();
                cy.get("#ops-modal-heading").should("not.exist");
                cy.get('[data-cy="alert"]').should("exist");
                cy.visit(`http://localhost:3000/agreements/${agreementId}`);
                cy.get('[data-cy="procurement-shop-tag"]')
                    .contains("IBC")
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
                checkAgreementHistory();
                cy.get(
                    '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                ).should("have.text", "Budget Line Deleted");
                cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]').should(
                    "have.text",
                    `System Owner deleted the Draft BL ${bliId}.`
                );
                cy.get(
                    '[data-cy="agreement-history-list"] > :nth-child(2) > .flex-justify > [data-cy="log-item-title"]'
                ).should("have.text", "Change to Procurement Shop");
                cy.get('[data-cy="agreement-history-list"] > :nth-child(2) > [data-cy="log-item-message"]').should(
                    "have.text",
                    "System Owner changed the Procurement Shop from GCS to IBC. This changes the fee rate from 0% to 4.80% and the fee total from $0.00 to $48,000.00."
                );
            });
    });
});

describe("Procurement Shop Change Requests at the card level", () => {
    it("Division Director should be able to approve CR at the card level", () => {
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
            // submit PATCH for procurement shop change via REST
            .then(({ agreementId, bliId }) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
                    body: {
                        awarding_entity_id: 4
                    },
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(202);
                    return { agreementId, bliId };
                });
            })
            .then(({ agreementId, bliId }) => {
                // log out and log in as division director
                cy.contains("Sign-Out").click();
                cy.visit("/");
                testLogin("division-director");

                cy.visit("/agreements?filter=change-requests");
                cy.get("[data-cy='review-card']").should("exist");
                // verify card information
                cy.get("[data-cy='review-card']")
                    .should("contain", "Budget Change")
                    .and("contain", "Procurement Shop")
                    .and("contain", "Fee Rate")
                    .and("contain", "Fee Total")
                    .and("contain", "GCS")
                    .and("contain", "0%")
                    .and("contain", "$0")
                    .and("contain", "IBC")
                    .and("contain", "4.8%")
                    .and("contain", "$48,000.00");

                cy.get("[data-cy='review-card']").eq(1).trigger("mouseover");
                cy.get("#approve").click();
                // usa-modal__content class should exist
                cy.get(".usa-modal__content").should("exist");
                cy.get(".usa-modal__content").contains(/are you sure you want to approve this budget change?/i);
                // click on button data-cy confirm-action
                cy.get("[data-cy='confirm-action']").click();
                // verify alert message
                cy.get(".usa-alert__body").contains(/changes approved/i);
                cy.get("[data-cy='close-alert']")
                    .click()
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
                        // check procurement shop related agremeent history messages
                        cy.visit(`http://localhost:3000/agreements/${agreementId}`);
                        checkAgreementHistory();
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(2) > .flex-justify > [data-cy="log-item-title"]'
                        ).should("have.text", "Change to Procurement Shop Approved");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(2) > [data-cy="log-item-message"]'
                        ).should(
                            "have.text",
                            "Dave Director approved the change on the Procurement Shop from GCS to IBC as requested by System Owner. This changes the fee rate from 0% to 4.80% and the fee total from $0.00 to $48,000.00."
                        );
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
    it("Division Director should be able to decline CR at the card level", () => {
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
            // submit PATCH for procurement shop change via REST
            .then(({ agreementId, bliId }) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
                    body: {
                        awarding_entity_id: 4
                    },
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(202);
                    return { agreementId, bliId };
                });
            })
            .then(({ agreementId, bliId }) => {
                // log out and log in as division director
                cy.contains("Sign-Out").click();
                cy.visit("/");
                testLogin("division-director");

                cy.visit("/agreements?filter=change-requests");
                cy.get("[data-cy='review-card']").should("exist");
                // verify card information
                cy.get("[data-cy='review-card']")
                    .should("contain", "Budget Change")
                    .and("contain", "Procurement Shop")
                    .and("contain", "Fee Rate")
                    .and("contain", "Fee Total")
                    .and("contain", "GCS")
                    .and("contain", "0%")
                    .and("contain", "$0")
                    .and("contain", "IBC")
                    .and("contain", "4.8%")
                    .and("contain", "$48,000.00");

                cy.get("[data-cy='review-card']").eq(1).trigger("mouseover");
                cy.get("#decline").click();
                // usa-modal__content class should exist
                cy.get(".usa-modal__content").should("exist");
                cy.get(".usa-modal__content").contains(/are you sure you want to decline this budget change?/i);
                // click on button data-cy confirm-action
                cy.get("[data-cy='confirm-action']").click();
                // verify alert message
                cy.get(".usa-alert__body").contains(/changes declined/i);
                cy.get("[data-cy='close-alert']")
                    .click()
                    .then(() => {
                        // check procurement shop related agremeent history messages
                        cy.visit(`http://localhost:3000/agreements/${agreementId}`);
                        checkAgreementHistory();
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).should("have.text", "Change to Procurement Shop Declined");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]'
                        ).should(
                            "have.text",
                            "Dave Director declined the change on the Procurement Shop from GCS to IBC as requested by System Owner."
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
});

describe("Procurement Shop Change Requests at the agreement level", () => {
    it("Division Director should be able to approve CR at the agreement level", () => {
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
            // submit PATCH for procurement shop change via REST
            .then(({ agreementId, bliId }) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
                    body: {
                        awarding_entity_id: 4
                    },
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(202);
                    return { agreementId, bliId };
                });
            })
            .then(({ agreementId, bliId }) => {
                // log out and log in as division director
                cy.contains("Sign-Out").click();
                cy.visit("/");
                testLogin("division-director");

                cy.visit("/agreements?filter=change-requests");
                cy.get("[data-cy='review-card']").should("exist");
                cy.get("[data-cy='approve-agreement']").eq(1).click();
                cy.get("h1").contains(/approval for budget change/i); // check for proc_shop card
                // NOTE: After Approval toggle is default on
                cy.get("[data-cy='review-card']").contains(/procurement shop/i);
                // check agreement meta for css class  of text-brand-portfolio-budget-graph-3
                cy.get("[data-testid='term-container']")
                    .filter(':contains("Procurement Shop")')
                    .should("have.class", "text-brand-portfolio-budget-graph-3");
                // check review BLI accoridion for left card proc_shop change currency-summary-card
                cy.get("[data-cy='currency-summary-card']").should("exist");
                cy.get("[data-cy='currency-summary-card']").contains(/ibc/i);
                cy.get("[data-cy='blis-by-fy-card']").contains("$1,048,000.00");
                cy.get(".usa-table").should("exist");
                // table should contains a table item  with text PLANNED and css class table-item-diff
                cy.get(".table-item-diff").contains("$48,000.00");
                cy.get(".table-item-diff").contains("$1,048,000.00");
                // NOTE: CAN summary card  test is flaky
                // budget-summary-card-504 should contain $199,433,046.00 of $40,000,000.00
                // cy.get("[data-cy='budget-summary-card-504']")
                //     .should("contain", "$199,433,046.00")
                //     .and("contain", "$40,000,000.00");
                // NOTE: Before Approval toggle is now in play
                cy.get('[data-cy="button-toggle-After Approval"]').first().click();
                cy.get("[data-cy='currency-summary-card']").contains(/gcs/i);
                cy.get("[data-cy='blis-by-fy-card']").contains("$1,000,000.00");
                cy.get(".usa-table").should("exist");
                // table should contains a table item  with text PLANNED and css class table-item-diff
                cy.get(".table-item-diff").contains("$0");
                cy.get(".table-item-diff").contains("$1,000,000.00");
                // NOTE: CAN summary card  test is flaky
                // budget-summary-card-504 should contain $199,433,046.00 of $40,000,000.00
                // cy.get("[data-cy='budget-summary-card-504']")
                //     .should("contain", "$199,385,046.00")
                //     .and("contain", "$40,000,000.00");
                cy.get(".usa-checkbox__label").click();
                cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
                cy.get('[data-cy="send-to-approval-btn"]').click();
                // usa-modal__content class should exist
                cy.get(".usa-modal__content").should("exist");
                cy.get(".usa-modal__content").contains(/are you sure you want to approve this budget change?/i);
                // click on button data-cy confirm-action
                cy.get("[data-cy='confirm-action']").click();
                // verify alert message
                cy.get(".usa-alert__body")
                    .contains(/changes approved/i)
                    .then(() => {
                        // check procurement shop related agremeent history messages
                        cy.visit(`http://localhost:3000/agreements/${agreementId}`);
                        checkAgreementHistory();
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).should("have.text", "Change to Procurement Shop Approved");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]'
                        ).should(
                            "have.text",
                            "Dave Director approved the change on the Procurement Shop from GCS to IBC as requested by System Owner. This changes the fee rate from 0% to 4.80% and the fee total from $0.00 to $48,000.00."
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
    it("Division Director should be able to decline CR at the agreement level", () => {
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
            // submit PATCH for procurement shop change via REST
            .then(({ agreementId, bliId }) => {
                cy.request({
                    method: "PATCH",
                    url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
                    body: {
                        awarding_entity_id: 4
                    },
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(202);
                    return { agreementId, bliId };
                });
            })
            .then(({ agreementId, bliId }) => {
                // log out and log in as division director
                cy.contains("Sign-Out").click();
                cy.visit("/");
                testLogin("division-director");

                cy.visit("/agreements?filter=change-requests");
                cy.get("[data-cy='review-card']").should("exist");
                cy.get("[data-cy='approve-agreement']").eq(1).click();
                cy.get("h1").contains(/approval for budget change/i); // check for proc_shop card
                // NOTE: After Approval toggle is default on
                cy.get("[data-cy='review-card']").contains(/procurement shop/i);
                // check agreement meta for css class  of text-brand-portfolio-budget-graph-3
                cy.get("[data-testid='term-container']")
                    .filter(':contains("Procurement Shop")')
                    .should("have.class", "text-brand-portfolio-budget-graph-3");
                // check review BLI accoridion for left card proc_shop change currency-summary-card
                cy.get("[data-cy='currency-summary-card']").should("exist");
                cy.get("[data-cy='currency-summary-card']").contains(/ibc/i);
                cy.get("[data-cy='blis-by-fy-card']").contains("$1,048,000.00");
                cy.get(".usa-table").should("exist");
                // table should contains a table item  with text PLANNED and css class table-item-diff
                cy.get(".table-item-diff").contains("$48,000.00");
                cy.get(".table-item-diff").contains("$1,048,000.00");
                // NOTE: CAN summary card  test is flaky
                // budget-summary-card-504 should contain $199,433,046.00 of $40,000,000.00
                // cy.get("[data-cy='budget-summary-card-504']")
                //     .should("contain", "$199,433,046.00")
                //     .and("contain", "$40,000,000.00");
                // NOTE: Before Approval toggle is now in play
                cy.get('[data-cy="button-toggle-After Approval"]').first().click();
                cy.get("[data-cy='currency-summary-card']").contains(/gcs/i);
                cy.get("[data-cy='blis-by-fy-card']").contains("$1,000,000.00");
                cy.get(".usa-table").should("exist");
                // table should contains a table item  with text PLANNED and css class table-item-diff
                cy.get(".table-item-diff").contains("$0");
                cy.get(".table-item-diff").contains("$1,000,000.00");
                // NOTE: CAN summary card  test is flaky
                // budget-summary-card-504 should contain $199,433,046.00 of $40,000,000.00
                // cy.get("[data-cy='budget-summary-card-504']")
                //     .should("contain", "$199,385,046.00")
                //     .and("contain", "$40,000,000.00");
                cy.get('[data-cy="decline-approval-btn"]').should("not.be.disabled");
                cy.get('[data-cy="decline-approval-btn"]').click();
                // usa-modal__content class should exist
                cy.get(".usa-modal__content").should("exist");
                cy.get(".usa-modal__content").contains(/are you sure you want to decline this budget change?/i);
                // click on button data-cy confirm-action
                cy.get("[data-cy='confirm-action']").click();
                // verify alert message
                cy.get(".usa-alert__body")
                    .contains(/changes declined/i)
                    .then(() => {
                        // check procurement shop related agremeent history messages
                        cy.visit(`http://localhost:3000/agreements/${agreementId}`);
                        checkAgreementHistory();
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                        ).should("have.text", "Change to Procurement Shop Declined");
                        cy.get(
                            '[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]'
                        ).should(
                            "have.text",
                            "Dave Director declined the change on the Procurement Shop from GCS to IBC as requested by System Owner."
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
});

const checkAgreementHistory = () => {
    cy.get("h3.history-title").should("have.text", "History");
    cy.get('[data-cy="agreement-history-container"]').should("exist").scrollIntoView();
    cy.get('[data-cy="agreement-history-list"]', { timeout: 20000 }).should("be.visible");
    cy.get('[data-cy="agreement-history-list"] [data-cy="log-item-title"]', { timeout: 20000 }).should(
        "have.length.at.least",
        1
    );
};
