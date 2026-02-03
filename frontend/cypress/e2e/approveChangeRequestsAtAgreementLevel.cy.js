/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

let testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Approve CRs Agreement Level",
    description: "Test Description",
    project_id: 1000,
    product_service_code_id: 1,
    awarding_entity_id: 2,
    project_officer_id: 500,
    service_requirement_type: "NON_SEVERABLE",
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
    proc_shop_fee_percentage: 0,
    services_component_id: testAgreement["awarding_entity_id"]
};

beforeEach(() => {
    // append a unique identifier to the agreement name to avoid conflicts
    const uniqueId = Date.now();
    testAgreement.name = `E2E Approve CRs Agreement Level ${uniqueId}`;

    testLogin("budget-team");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});
// TODO: add more tests for an agreement with a DRAFT and PLANNED BLIs
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
            // Create draft BLI
            .then(({ agreementId, bliId }) => {
                const draftBliData = {
                    ...testBli,
                    agreement_id: agreementId
                };
                cy.request({
                    method: "POST",
                    url: "http://localhost:8080/api/v1/budget-line-items/",
                    body: draftBliData,
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(201);
                    expect(response.body.id).to.exist;
                    const draftBliId = response.body.id;
                    return { agreementId, bliId, draftBliId };
                });
            })
            // test interactions
            .then(({ agreementId, bliId, draftBliId }) => {
                // log out and log in as division director
                cy.contains("Sign-Out").click();
                cy.visit("/").wait(1000);
                testLogin("division-director");

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
                // Wait for all data including CANs to load before proceeding with approval
                // This ensures the alert message will be constructed correctly
                cy.get("[data-cy='review-card']", { timeout: 10000 }).should("be.visible");
                // get content in review-card to see if it exists and contains planned, status and amount
                cy.get("[data-cy='review-card']").contains(/draft/i);
                cy.get("[data-cy='review-card']").contains(/planned/i);
                cy.get("[data-cy='review-card']").contains(/status/i);
                cy.get("[data-cy='review-card']").contains(/total/i);
                cy.get("[data-cy='review-card']").contains("$1,000,000.00");
                //class accordion__content contains a paragraph that contains the text planned status change
                cy.get(".usa-accordion__content").contains("planned status changes");
                // section BLs not associated with a Services Component should have a table
                cy.get(".usa-table").should("exist");
                // table should contains a table item  with text PLANNED and css class table-item-diff
                cy.get(".table-item-diff").contains("Planned");
                cy.get('[data-cy="currency-summary-card-total"]').contains("$1,000,000.00");
                cy.get('[data-cy="blis-by-fy-card"]').contains("$1,000,000.00");
                cy.get('[data-cy="button-toggle-After Approval"]').first().click();
                // table should contains a table item  with text DRAFT and css class table-item-diff
                cy.get(".table-item-diff").contains("Draft");
                cy.get('[data-cy="currency-summary-card-total"]').contains("$0");
                cy.get('[data-cy="currency-summary-card-subtotal"]').contains("$0");
                cy.get('[data-cy="currency-summary-card-fees"]').contains("$0");
                // click on checkbox with id approve-confirmation
                cy.get(".usa-checkbox__label").click();
                cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
                cy.get('[data-cy="send-to-approval-btn"]').click();
                cy.get("#ops-modal-heading").contains(/approve this status change to planned status?/i);
                // Intercept the change request approval API call and the subsequent agreements list load
                cy.intercept("PATCH", "/api/v1/change-requests/").as("approveChangeRequest");
                cy.intercept("GET", "**/api/v1/agreements/**").as("getAgreements");
                cy.get('[data-cy="confirm-action"]').click();
                // Wait for the API request to complete before checking the alert
                cy.wait("@approveChangeRequest").its("response.statusCode").should("eq", 200);
                cy.wait("@getAgreements").its("response.statusCode").should("eq", 200);
                cy.url().should("include", "/agreements?filter=change-requests");
                // Wait for React 19 to render the page after navigation
                cy.wait(1000);
                // Increase timeout for CI environments where page rendering can be slower
                // Check for alert in a single assertion chain so Cypress retries the entire check
                cy.get(".usa-alert__body", {timeout: 30000})
                    .should("be.visible")
                    .and("contain", "Changes Approved")
                    .and("contain", testAgreement.name)
                    .and("contain", `BL ${bliId} Status: Draft to Planned`);
                cy.get("[data-cy='close-alert']").click();
                cy.get("[data-cy='review-card']").should("not.exist");
                // nav element should not contain the text 1
                cy.get('[role="navigation"]').should("not.contain", "1");
                // verify agreement history
                cy.intercept("GET", `/api/v1/agreements/${agreementId}`).as("getAgreementDetail");
                cy.visit(`/agreements/${agreementId}`);
                cy.wait("@getAgreementDetail");
                // checkAgreementHistory has built-in timeout logic
                checkAgreementHistory();
                cy.get(
                    '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                ).contains(/Status Change to Planned Approved/);
                cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]').should(
                    "exist"
                );
                cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]')
                    .should(
                        "have.text",
                        `Dave Director approved the status change on BL ${bliId} from Draft to Planned as requested by Budget Team.`
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
                            url: `http://localhost:8080/api/v1/budget-line-items/${draftBliId}`,
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
                // log out and log in as division director
                cy.contains("Sign-Out").click();
                cy.visit("/").wait(1000);
                testLogin("division-director");

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
                // Wait for review-card to load
                cy.get("[data-cy='review-card']", { timeout: 10000 }).should("be.visible");
                // get content in review-card to see if it exists and contains planned, status and amount
                cy.get("[data-cy='review-card']").contains(/planned/i);
                cy.get("[data-cy='review-card']").contains(/executing/i);
                cy.get("[data-cy='review-card']").contains(/status/i);
                cy.get("[data-cy='review-card']").contains(/total/i);
                cy.get("[data-cy='review-card']").contains("$1,000,000.00");
                //class accordion__content contains a paragraph that contains the text planned status change
                cy.get(".usa-accordion__content").contains("executing status changes");
                // section BLs not associated with a Services Component should have a table
                cy.get(".usa-table").should("exist");
                // table should contains a table item  with text PLANNED and css class table-item-diff
                cy.get(".table-item-diff").contains("Executing");
                cy.get('[data-cy="button-toggle-After Approval"]').first().click();
                cy.get(".table-item-diff").contains("Planned");
                // click on checkbox with id approve-confirmation
                cy.get(".usa-checkbox__label").click();
                cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
                cy.get('[data-cy="send-to-approval-btn"]').click();
                cy.get("#ops-modal-heading").contains(/approve this status change to executing status?/i);
                // Intercept the change request approval API call and the subsequent agreements list load
                cy.intercept("PATCH", "/api/v1/change-requests/").as("approveChangeRequest");
                cy.intercept("GET", "**/api/v1/agreements/**").as("getAgreements");
                cy.get('[data-cy="confirm-action"]').click();
                // Wait for the API request to complete before checking the alert
                cy.wait("@approveChangeRequest").its("response.statusCode").should("eq", 200);
                cy.wait("@getAgreements").its("response.statusCode").should("eq", 200);
                cy.url().should("include", "/agreements?filter=change-requests");
                // Wait for React 19 to render the page after navigation
                cy.wait(1000);
                // Increase timeout for CI environments where page rendering can be slower
                // First check if alert exists and log its content for debugging
                cy.get(".usa-alert__body", {timeout: 30000}).should("exist");
                // Check for alert in a single assertion chain so Cypress retries the entire check
                cy.get(".usa-alert__body", {timeout: 30000})
                    .should("be.visible")
                    .and("contain", "Changes Approved")
                    .and("contain", testAgreement.name)
                    .and("contain", `BL ${bliId} Status: Planned to Executing`);
                cy.get("[data-cy='close-alert']").click();
                cy.get("[data-cy='review-card']").should("not.exist");
                // nav element should not contain the text 1
                cy.get('[role="navigation"]').should("not.contain", "1");
                // verify agreement history
                cy.intercept("GET", `/api/v1/agreements/${agreementId}`).as("getAgreementDetail");
                cy.visit(`/agreements/${agreementId}`);
                cy.wait("@getAgreementDetail");
                // checkAgreementHistory has built-in timeout logic
                checkAgreementHistory();
                cy.get(
                    '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
                ).contains(/Status Change to Executing Approved/);
                cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]').should(
                    "exist"
                );
                cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]')
                    .should(
                        "have.text",
                        `Dave Director approved the status change on BL ${bliId} from Planned to Executing as requested by Budget Team.`
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
    it("review Budget Change change", () => {
        // log out and log in as budget-team
        cy.contains("Sign-Out").click();
        cy.visit("/").wait(1000);
        testLogin("budget-team");

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
            // create 2 new DRAFT BLIS
            // Create draft BLI
            .then(({ agreementId, bliId }) => {
                const draftBliData = {
                    ...testBli,
                    agreement_id: agreementId
                };
                cy.request({
                    method: "POST",
                    url: "http://localhost:8080/api/v1/budget-line-items/",
                    body: draftBliData,
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(201);
                    expect(response.body.id).to.exist;
                    const draftBliId = response.body.id;
                    return { agreementId, bliId, draftBliId };
                });
            })
            .then(({ agreementId, bliId }) => {
                const draftBliData = {
                    ...testBli,
                    agreement_id: agreementId
                };
                cy.request({
                    method: "POST",
                    url: "http://localhost:8080/api/v1/budget-line-items/",
                    body: draftBliData,
                    headers: {
                        Authorization: bearer_token,
                        Accept: "application/json"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(201);
                    expect(response.body.id).to.exist;
                    const draftBliId = response.body.id;
                    return { agreementId, bliId, draftBliId };
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
                        date_needed: "2044-09-15",
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
                // log out and log in as division director
                cy.contains("Sign-Out").click();
                cy.visit("/").wait(1000);
                testLogin("division-director");

                cy.visit("/agreements?filter=change-requests").wait(1000);
                // see if there are any review cards
                cy.get("[data-cy='review-card']").should("exist").contains("Budget Change");
                cy.get("[data-cy='review-card']").contains(/planned/i);
                cy.get('[role="navigation"]').contains("3");
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
                cy.get("[data-cy='review-card']").contains("G994426");
                cy.get("[data-cy='review-card']").contains("G99PHS9");
                // next card
                cy.get("[data-cy='review-card']").contains(/obligate by date/i);
                cy.get("[data-cy='review-card']").contains("1/1/2044");
                cy.get("[data-cy='review-card']").contains("9/15/2044");
                //class accordion__content contains a paragraph that contains the text planned status change
                cy.get(".usa-accordion__content").contains("budget changes");
                // check summary cards
                cy.get('[data-cy="currency-summary-card-total"]').contains("$2,000,000.00");
                cy.get('[data-cy="blis-by-fy-card"]').contains("$2,000,000.00");
                // section BLs not associated with a Services Component should have a table
                cy.get(".usa-table").should("exist");
                // table should contains a table item  with text PLANNED and css class table-item-diff
                cy.get(".table-item-diff").contains("$2,000,000.00");
                cy.get(".table-item-diff").contains("G99PHS9");
                cy.get(".table-item-diff").contains("9/15/2044");
                cy.get('[data-cy="button-toggle-After Approval"]').first().click();
                // check summary cards
                cy.get('[data-cy="currency-summary-card-total"]').contains("$1,000,000.00");
                cy.get('[data-cy="blis-by-fy-card"]').contains("$1,000,000.00");
                cy.get(".table-item-diff").contains("1,000,000.00");
                cy.get(".table-item-diff").contains("G994426");
                cy.get(".table-item-diff").contains("1/1/2044");
                // TODO: add more tests
                // click on checkbox with id approve-confirmation
                cy.get(".usa-checkbox__label").click();
                cy.get('[data-cy="send-to-approval-btn"]').should("not.be.disabled");
                cy.get('[data-cy="send-to-approval-btn"]').click();
                cy.get("#ops-modal-heading").contains(/approve this budget change/i);
                // Intercept the change request approval API call
                cy.intercept("PATCH", "/api/v1/change-requests/").as("approveChangeRequest");
                cy.get('[data-cy="confirm-action"]').click();
                // Wait for the API request to complete before checking the alert
                cy.wait("@approveChangeRequest");
                cy.get(".usa-alert__body").should("contain", "Changes Approved");
                cy.get(".usa-alert__body").should("contain", testAgreement.name);
                cy.get(".usa-alert__body")
                    .should("include.text", `BL ${bliId} Amount: $1,000,000.00 to $2,000,000.00`)
                    .and("include.text", `BL ${bliId} Obligate By Date: 1/1/2044 to 9/15/2044`)
                    .and("include.text", `BL ${bliId} CAN: G994426 to G99PHS9`);
                cy.get("[data-cy='close-alert']").click();
                // nav element should not contain the text 1
                cy.get('[role="navigation"]').should("not.contain", "1");
                cy.get("[data-cy='review-card']").should("not.exist");
                // verify agreement history
                cy.intercept("GET", `/api/v1/agreements/${agreementId}`).as("getAgreementDetail");
                cy.visit(`/agreements/${agreementId}`);
                cy.wait("@getAgreementDetail");
                // checkAgreementHistory has built-in timeout logic
                checkAgreementHistory();

                // In your test
                cy.get('[data-cy="agreement-history-list"]').should("exist");

                checkHistoryItem(
                    /Budget Change to Amount Approved/,
                    `Dave Director approved the budget change on BL ${bliId} from $1,000,000.00 to $2,000,000.00 as requested by Budget Team.`
                )
                    .then(() => {
                        return checkHistoryItem(
                            /Budget Change to CAN Approved/,
                            `Dave Director approved the budget change on BL ${bliId} from CAN G994426 to CAN G99PHS9 as requested by Budget Team.`
                        );
                    })
                    .then(() => {
                        return checkHistoryItem(
                            /Budget Change to Obligate By Approved/,
                            `Dave Director approved the budget change on BL ${bliId} from Obligate By on 01/01/2044 to 09/15/2044 as requested by Budget Team.`
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
    // Wait for history list to have children with proper retry logic
    cy.get('[data-cy="agreement-history-list"]', { timeout: 30000 }).should(($list) => {
        expect($list.children().length).to.be.at.least(1);
    });
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
            cy.get('[data-cy="log-item-message"]').should("exist").and("have.text", expectedText);
        });
};
