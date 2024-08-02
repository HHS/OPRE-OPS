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
    awarding_entity_id: 1,
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
    amount: 1_000_000,
    status: BLI_STATUS.DRAFT,
    date_needed: "2025-01-01",
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

describe("Approve Change Requests at the Agreement Level", () => {
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
                // nav element with the role navigation should contain text 1
                cy.get('[role="navigation"]').contains("1");
                cy.get("[data-cy='review-card']").contains(/planned/i);
                // hover over the review card
                cy.get("[data-cy='review-card']").trigger("mouseover");
                // click on button data-cy approve-agreement
                cy.get("[data-cy='approve-agreement']").click();
                // get h1 to have content Approval for Status Change - Planned
                cy.get("h1").contains(/approval for status change - planned/i);
                // get content in review-card to see if it exists and contains planned, status and amount
                cy.get("[data-cy='review-card']").contains(/draft/i);
                cy.get("[data-cy='review-card']").contains(/planned/i);
                cy.get("[data-cy='review-card']").contains(/status/i);
                cy.get("[data-cy='review-card']").contains(/total/i);
                cy.get("[data-cy='review-card']").contains("$1,005,000.00");
                //class accordion__content contains a paragraph that contains the text planned status change
                cy.get(".usa-accordion__content").contains("planned status changes");
                // section BLs not associated with a Services Component should have a table
                cy.get(".usa-table").should("exist");
                // table should contains a table item  with text PLANNED and css class table-item-diff
                cy.get(".table-item-diff").contains("Planned");
                cy.get('[data-cy="button-toggle-After Approval"]').click();
                cy.get(".table-item-diff").contains("Draft");
                // click on checkbox with id approve-confirmation
                cy.get(".usa-checkbox__label").click();
                cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
                cy.get('[data-cy="send-to-approval-btn"]').click();
                cy.get("#ops-modal-heading").contains(/approve this status change to planned status?/i);
                cy.get('[data-cy="confirm-action"]').click();
                cy.get(".usa-alert__body").should("contain", "Changes Approved");
                cy.get(".usa-alert__body").should("contain", "E2E Test agreementWorkflow 1");
                cy.get(".usa-alert__body").should("contain", `BL ${bliId} Status: Draft to Planned`);
                cy.get("[data-cy='close-alert']").click();
                cy.get("[data-cy='review-card']").should("not.exist");
                // nav element should not contain the text 1
                cy.get('[role="navigation"]').should("not.contain", "1");
                // verify agreement history
                cy.visit(`/agreements/${agreementId}`);
                checkAgreementHistory();
                cy.get(
                    '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                ).contains(/Status Change to Planned Approved/);
                cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-children"]').should(
                    "exist"
                );
                cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-children"]')
                    .should(
                        "have.text",
                        `Admin Demo approved the status change on BL ${bliId} from Draft to Planned as requested by Admin Demo.`
                    )
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
                cy.get('[role="navigation"]').contains("1");
                // hover over the review card
                cy.get("[data-cy='review-card']").trigger("mouseover");
                // click on button data-cy approve-agreement
                cy.get("[data-cy='approve-agreement']").click();
                // get h1 to have content Approval for Status Change - Planned
                cy.get("h1").contains(/approval for status change - executing/i);
                // get content in review-card to see if it exists and contains planned, status and amount
                cy.get("[data-cy='review-card']").contains(/planned/i);
                cy.get("[data-cy='review-card']").contains(/executing/i);
                cy.get("[data-cy='review-card']").contains(/status/i);
                cy.get("[data-cy='review-card']").contains(/total/i);
                cy.get("[data-cy='review-card']").contains("$1,005,000.00");
                //class accordion__content contains a paragraph that contains the text planned status change
                cy.get(".usa-accordion__content").contains("executing status changes");
                // section BLs not associated with a Services Component should have a table
                cy.get(".usa-table").should("exist");
                // table should contains a table item  with text PLANNED and css class table-item-diff
                cy.get(".table-item-diff").contains("Executing");
                cy.get('[data-cy="button-toggle-After Approval"]').click();
                cy.get(".table-item-diff").contains("Planned");
                // click on checkbox with id approve-confirmation
                cy.get(".usa-checkbox__label").click();
                cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
                cy.get('[data-cy="send-to-approval-btn"]').click();
                cy.get("#ops-modal-heading").contains(/approve this status change to executing status?/i);
                cy.get('[data-cy="confirm-action"]').click();
                cy.get(".usa-alert__body").should("contain", "Changes Approved");
                cy.get(".usa-alert__body").should("contain", "E2E Test agreementWorkflow 1");
                cy.get(".usa-alert__body").should("contain", `BL ${bliId} Status: Planned to Executing`);
                cy.get("[data-cy='close-alert']").click();
                cy.get("[data-cy='review-card']").should("not.exist");
                // nav element should not contain the text 1
                cy.get('[role="navigation"]').should("not.contain", "1");
                // verify agreement history
                cy.visit(`/agreements/${agreementId}`);
                checkAgreementHistory();
                cy.get(
                    '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                ).contains(/Status Change to Executing Approved/);
                cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-children"]').should(
                    "exist"
                );
                cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-children"]')
                    .should(
                        "have.text",
                        `Admin Demo approved the status change on BL ${bliId} from Planned to Executing as requested by Admin Demo.`
                    )
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
    it.only("review Budget Change change", () => {
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
                        can_id: 502,
                        date_needed: "2025-09-15",
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
                cy.get("[data-cy='review-card']").contains(/planned/i);
                // cy.get('[role="navigation"]').contains("3");
                // hover over the review card
                cy.get("[data-cy='review-card']").first().trigger("mouseover");
                // click on button data-cy approve-agreement
                cy.get("[data-cy='approve-agreement']").first().click();
                // get h1 to have content Approval for
                cy.get("h1").contains(/approval for budget change/i);
                // get content in review-cards
                cy.get("[data-cy='review-card']").contains(/planned/i);
                cy.get("[data-cy='review-card']").contains(/amount/i);
                cy.get("[data-cy='review-card']").contains("$1,000,000.00");
                cy.get("[data-cy='review-card']").contains("$2,000,000.00");
                // next card
                cy.get("[data-cy='review-card']").contains(/can/i);
                cy.get("[data-cy='review-card']").contains("G99IA14");
                cy.get("[data-cy='review-card']").contains("G99PHS9");
                // next card
                cy.get("[data-cy='review-card']").contains(/obligate by date/i);
                cy.get("[data-cy='review-card']").contains("1/1/2025");
                cy.get("[data-cy='review-card']").contains("9/15/2025");
                //class accordion__content contains a paragraph that contains the text planned status change
                cy.get(".usa-accordion__content").contains("budget changes");
                // section BLs not associated with a Services Component should have a table
                cy.get(".usa-table").should("exist");
                // table should contains a table item  with text PLANNED and css class table-item-diff
                cy.get(".table-item-diff").contains("$2,000,000.00");
                cy.get(".table-item-diff").contains("G99PHS9");
                cy.get(".table-item-diff").contains("9/15/2025");
                cy.get('[data-cy="can-funding-summary-card-501"]').should("exist");
                // and contain $ 7,995,000 and $ 2,205,000
                cy.get('[data-cy="can-funding-summary-card-501"]').contains("$ 5,995,000");
                cy.get('[data-cy="can-funding-summary-card-501"]').contains("$ 4,205,000");
                cy.get('[data-cy="can-funding-summary-card-502"]').should("exist");
                // and contain $ 11,710,000 and $ 12,290,000
                cy.get('[data-cy="can-funding-summary-card-502"]').contains("$ 9,700,000");
                cy.get('[data-cy="can-funding-summary-card-502"]').contains("$ 14,300,000");
                cy.get('[data-cy="button-toggle-After Approval"]').click();
                cy.get(".table-item-diff").contains("1,000,000.00");
                cy.get(".table-item-diff").contains("G99IA14");
                cy.get(".table-item-diff").contains("1/1/2025");
                cy.get('[data-cy="can-funding-summary-card-501"]').contains("$ 7,000,000");
                cy.get('[data-cy="can-funding-summary-card-501"]').contains("$ 3,200,000");
                cy.get('[data-cy="can-funding-summary-card-502"]').contains("$ 11,710,000");
                cy.get('[data-cy="can-funding-summary-card-502"]').contains("$ 12,290,000");
                // TODO: add more tests
                // click on checkbox with id approve-confirmation
                cy.get(".usa-checkbox__label").click();
                cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
                cy.get('[data-cy="send-to-approval-btn"]').click();
                cy.get("#ops-modal-heading").contains(/approve this budget change/i);
                cy.get('[data-cy="confirm-action"]').click();
                cy.get(".usa-alert__body").should("contain", "Changes Approved");
                cy.get(".usa-alert__body").should("contain", "E2E Test agreementWorkflow 1");
                cy.get(".usa-alert__body")
                    .should("include.text", `BL ${bliId} Amount: $1,000,000.00 to $2,000,000.00`)
                    .and("include.text", `BL ${bliId} Obligate By Date: 1/1/2025 to 9/15/2025`)
                    .and("include.text", `BL ${bliId} CAN: G99IA14 to G99PHS9`);
                cy.get("[data-cy='close-alert']").click();
                // nav element should not contain the text 1
                cy.get('[role="navigation"]').should("not.contain", "1");
                cy.get("[data-cy='review-card']").should("not.exist");
                // verify agreement history
                cy.visit(`/agreements/${agreementId}`);
                checkAgreementHistory();

                // In your test
                cy.get('[data-cy="agreement-history-list"]').should("exist");

                checkHistoryItem(
                    /Budget Change to Amount Approved/,
                    `Admin Demo approved the budget change on BL ${bliId} from $1,000,000.00 to $2,000,000.00 as requested by Admin Demo.`
                )
                    .then(() => {
                        return checkHistoryItem(
                            /Budget Change to CAN Approved/,
                            `Admin Demo approved the budget change on BL ${bliId} from G99IA14 to G99PHS9 as requested by Admin Demo.`
                        );
                    })
                    .then(() => {
                        return checkHistoryItem(
                            /Budget Change to Obligate Date Approved/,
                            `Admin Demo approved the budget change on BL ${bliId} from 1/1/2025 to 9/15/2025 as requested by Admin Demo.`
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
    cy.get(".usa-breadcrumb__list > :nth-child(3)").should("have.text", testAgreement.name);
    cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
    cy.get('[data-cy="agreement-history-container"]').should("exist");
    cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
    cy.get('[data-cy="agreement-history-list"]').should("exist");
    cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]').should(
        "exist"
    );
};

const checkHistoryItem = (titleRegex, expectedText) => {
    return cy
        .get('[data-cy="agreement-history-list"]')
        .contains('[data-cy="log-item-title"]', titleRegex)
        .closest("li")
        .within(() => {
            cy.get('[data-cy="log-item-children"]').should("exist").and("have.text", expectedText);
        });
};
