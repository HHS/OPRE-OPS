/// <reference types="cypress" />

import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { terminalLog, testLogin } from "./utils";

const testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Test agreementWorkflow 1",
    contract_type: "FIRM_FIXED_PRICE",
    description: "Test Description",
    project_id: 1000,
    product_service_code_id: 1,
    awarding_entity_id: 2,
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
    proc_shop_fee_percentage: 0.005
};

beforeEach(() => {
    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Budget Change Requests", () => {
    it("should handle a Budget Change", () => {
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
            .then(({ agreementId, bliId }) => {
                cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines?mode=edit`);
                cy.get("#servicesComponentSelect").select("1");
                cy.get("#pop-start-date").type("01/01/2044");
                cy.get("#pop-end-date").type("01/01/2045");
                cy.get("#description").type("This is a description.");
                cy.get("[data-cy='add-services-component-btn']").click();
                cy.get("tbody").children().as("table-rows").should("have.length", 1);
                cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                cy.get("[data-cy='edit-row']").click();
                cy.get("#allServicesComponentSelect").select("SC1");
                cy.get("#enteredAmount").clear();
                cy.get("#enteredAmount").type("2_222_222");
                cy.get("#need-by-date").clear();
                cy.get("#need-by-date").type("01/01/2048");
                cy.get("#can-combobox-input").clear();
                cy.get("#can-combobox-input").type("G99MVT3{enter}");
                cy.get('[data-cy="update-budget-line"]').click();
                cy.get('[data-cy="continue-btn"]').click();
                cy.get('[data-cy="confirm-action"]').click();
                cy.get('[data-cy="alert"]').should("exist");
                cy.get('[data-cy="alert"]').should(($alert) => {
                    expect($alert).to.contain(`BL ${bliId} Amount: $1,000,000.00 to $2,222,222.00`);
                    expect($alert).to.contain(`BL ${bliId} Obligate By Date: 1/1/2044 to 1/1/2048`);
                    expect($alert).to.contain(`BL ${bliId} CAN: G994426 to G99MVT3`);
                });
                // verify agreement history
                cy.visit(`/agreements/${agreementId}`);
                cy.get(".usa-breadcrumb__list > :nth-child(3)").should("have.text", testAgreement.name);
                cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
                cy.get('[data-cy="agreement-history-container"]').should("exist");
                cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
                cy.get('[data-cy="agreement-history-list"]').should("exist");

                checkHistoryItem(
                    /Budget Change to CAN In Review/,
                    `System Owner requested a budget change on BL ${bliId} from G994426 to G99MVT3 and it's currently In Review for approval.`
                )
                    .then(() => {
                        return checkHistoryItem(
                            /Budget Change to Amount In Review/,
                            `System Owner requested a budget change on BL ${bliId} from $1,000,000.00 to $2,222,222.00 and it's currently In Review for approval.`
                        );
                    })
                    .then(() => {
                        return checkHistoryItem(
                            /Budget Change to Obligate Date In Review/,
                            `System Owner requested a budget change on BL ${bliId} from 1/1/2044 to 1/1/2048 and it's currently In Review for approval.`
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

    it("should allow alternate project officer to edit budget lines", () => {
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
            .then(({ agreementId, bliId }) => {
                // test alternate project officer has edit persmission
                cy.get('[data-cy="sign-out"]').click();
                cy.visit("/").wait(1000);
                testLogin("budget-team");
                cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                cy.get("#edit").should("exist");

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

    it("should handle adding a DRAFT BLI and a Budget change request", () => {
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
            .then(({ agreementId, bliId }) => {
                cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines?mode=edit`);
                cy.get("#servicesComponentSelect").select("1");
                cy.get("#pop-start-date").type("01/01/2044");
                cy.get("#pop-end-date").type("01/01/2045");
                cy.get("#description").type("This is a description.");
                cy.get("[data-cy='add-services-component-btn']").click();
                cy.get("tbody").children().as("table-rows").should("have.length", 1);
                cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                cy.get("[data-cy='edit-row']").click();
                cy.get("#allServicesComponentSelect").select("SC1");
                cy.get("#enteredAmount").clear();
                cy.get("#enteredAmount").type("2_222_222");
                cy.get('[data-cy="update-budget-line"]').click();
                // add a DRAFT BLI
                cy.get("#allServicesComponentSelect").select("SC1");
                cy.get("#enteredAmount").clear();
                cy.get("#enteredAmount").type("3_333_333_333");
                cy.get("#add-budget-line").click();
                cy.get("tbody").children().as("table-rows").should("have.length", 2);
                cy.get('[data-cy="continue-btn"]').click();
                cy.get('[data-cy="confirm-action"]').click();
                cy.get('[data-cy="alert"]').should("exist");
                cy.get('[data-cy="alert"]').contains("$2,222,222.00");
                cy.get("[data-cy='close-alert']").first().click();
                // verify agreement history
                cy.visit(`/agreements/${agreementId}`);
                cy.get(".usa-breadcrumb__list > :nth-child(3)").should("have.text", testAgreement.name);
                cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
                cy.get('[data-cy="agreement-history-container"]').should("exist");
                cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
                cy.get('[data-cy="agreement-history-list"]').should("exist");
                checkHistoryItem(
                    /Budget Change to Amount In Review/,
                    `System Owner requested a budget change on BL ${bliId} from $1,000,000.00 to $2,222,222.00 and it's currently In Review for approval.`
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

    it("should handle a budget change from budgetlines page", () => {
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
            .then(({ agreementId, bliId }) => {
                cy.visit(
                    `/agreements/${agreementId}/budget-lines?mode=edit&budget-line-id=${bliId}#budget-lines-header`
                );
                cy.get("#servicesComponentSelect").select("1");
                cy.get("#pop-start-date").type("01/01/2044");
                cy.get("#pop-end-date").type("01/01/2045");
                cy.get("#description").type("This is a description.");
                cy.get("[data-cy='add-services-component-btn']").click();
                cy.get("tbody").children().as("table-rows").should("have.length", 1);
                cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                cy.get("[data-cy='edit-row']").click();
                cy.get("#allServicesComponentSelect").select("SC1");
                cy.get("#enteredAmount").clear();
                cy.get("#enteredAmount").type("2_222_222");
                cy.get('[data-cy="update-budget-line"]').click();
                cy.get('[data-cy="continue-btn"]').click();
                cy.get('[data-cy="confirm-action"]').click();
                cy.get('[data-cy="alert"]').should("exist");
                cy.get('[data-cy="alert"]').should(($alert) => {
                    expect($alert).to.contain(`BL ${bliId} Amount: $1,000,000.00 to $2,222,222.00`);
                });
                // verify agreement history
                cy.visit(`/agreements/${agreementId}`);
                cy.get(".usa-breadcrumb__list > :nth-child(3)").should("have.text", testAgreement.name);
                cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
                cy.get('[data-cy="agreement-history-container"]').should("exist");
                cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
                cy.get('[data-cy="agreement-history-list"]').should("exist");
                checkHistoryItem(
                    /Budget Change to Amount In Review/,
                    `System Owner requested a budget change on BL ${bliId} from $1,000,000.00 to $2,222,222.00 and it's currently In Review for approval.`
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

    it("should allow editing an agreement when a BLI is in review", () => {
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
                        amount: 1_000_001,
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
                    status: BLI_STATUS.DRAFT,
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
                cy.visit(`/agreements/${agreementId}`);
                cy.get("#edit").should("exist");
                cy.get('[data-cy="details-tab-SCs & Budget Lines"]').click();
                cy.get("#edit").should("exist");
                cy.get('[data-cy="bli-continue-btn"]')
                    .should("not.be.disabled")
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
});

const checkHistoryItem = (titleRegex, expectedText) => {
    return cy
        .get('[data-cy="agreement-history-list"]')
        .contains('[data-cy="log-item-title"]', titleRegex)
        .closest("li")
        .within(() => {
            cy.get('[data-cy="log-item-children"]').should("exist").and("have.text", expectedText);
        });
};
