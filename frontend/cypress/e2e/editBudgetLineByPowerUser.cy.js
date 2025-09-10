/// <reference types="cypress" />
import { testLogin, terminalLog } from "./utils";
import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";
import { AGREEMENT_TYPES } from "../../src/components/ServicesComponents/ServicesComponents.constants.js";
const testAgreement = {
    agreement_type: AGREEMENT_TYPES.CONTRACT,
    agreement_reason: "NEW_REQ",
    name: "E2E Test agreementWorkflow 1",
    display_name: "E2E Test agreementWorkflow 1",
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
const testIaaAgreement = {
    agreement_type: AGREEMENT_TYPES.IAA,
    agreement_reason: "NEW_REQ",
    name: "E2E Test agreementWorkflow 1",
    description: "Test Description",
    project_id: 1000,
    product_service_code_id: 1,
    awarding_entity_id: 2,
    project_officer_id: 500,
    alternate_project_officer_id: 523,
    team_members: [{ id: 520 }, { id: 504 }],
    notes: "Test Notes",
    direction: "INCOMING"
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

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Power User tests", () => {
    beforeEach(() => {
        testLogin("power-user");
    });

    it("can login as a power user", () => {
        cy.visit(`/users/528`);
        cy.get(".usa-card__body").should("contain", "Temp Year End Role");
        cy.get(".usa-card__body").should("contain", "power.user@email.com");
    });

    it("can edit an CONTRACT agreement budget lines", () => {
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
                })
                    .then((response) => {
                        expect(response.status).to.eq(201);
                        expect(response.body.id).to.exist;
                        const bliId = response.body.id;
                        return { agreementId, bliId };
                    })
                    .then(({ agreementId, bliId }) => {
                        cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                        cy.get("#edit").click();
                        cy.get("#servicesComponentSelect").select("1");
                        cy.get("#pop-start-date").type("01/01/2044");
                        cy.get("#pop-end-date").type("01/01/2045");
                        cy.get("#description").type("This is a description.");
                        cy.get("[data-cy='add-services-component-btn']").click();
                        cy.get("tbody").children().as("table-rows").should("have.length", 1);
                        cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                        cy.get("[data-cy='edit-row']").click();
                        cy.get("#allServicesComponentSelect").select("SC1");
                        cy.get("#need-by-date").clear();
                        cy.get("#need-by-date").type("02/02/2048");
                        cy.get("#can-combobox-input").clear();
                        cy.get("#can-combobox-input").type("G99MVT3{enter}");
                        cy.get("#enteredAmount").clear();
                        cy.get("#enteredAmount").type("2_000_000");
                        cy.get('[data-cy="update-budget-line"]').click();
                        cy.get('[data-cy="continue-btn"]').click();
                        cy.get('[data-cy="alert"]').should("exist");
                        cy.get('[data-cy="alert"]')
                            .should(($alert) => {
                                expect($alert).to.contain(
                                    `The agreement ${testAgreement.display_name} has been successfully updated.`
                                );
                            })
                            .then(() => {
                                // verify the updated data is displayed in the table
                                cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                                cy.get("@table-rows")
                                    .eq(0)
                                    .should("contain", "$2,000,000.00")
                                    .and("contain", "2/2/2048")
                                    .and("contain", "G99MVT3");
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

    it("can edit a GRANT agreement budget lines", () => {
        expect(localStorage.getItem("access_token")).to.exist;

        // create test agreement
        const grantAgreement = { ...testAgreement, agreement_type: AGREEMENT_TYPES.GRANT };
        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
        cy.request({
            method: "POST",
            url: "http://localhost:8080/api/v1/agreements/",
            body: grantAgreement,
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
                })
                    .then((response) => {
                        expect(response.status).to.eq(201);
                        expect(response.body.id).to.exist;
                        const bliId = response.body.id;
                        return { agreementId, bliId };
                    })
                    .then(({ agreementId, bliId }) => {
                        cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                        cy.get("#edit").click();
                        cy.get("#servicesComponentSelect").select("1");
                        cy.get("#pop-start-date").type("01/01/2044");
                        cy.get("#pop-end-date").type("01/01/2045");
                        cy.get("#description").type("This is a description.");
                        cy.get("[data-cy='add-services-component-btn']").click();
                        cy.get("tbody").children().as("table-rows").should("have.length", 1);
                        cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                        cy.get("[data-cy='edit-row']").click();
                        cy.get("#allServicesComponentSelect").select("SC1");
                        cy.get("#need-by-date").clear();
                        cy.get("#need-by-date").type("02/02/2048");
                        cy.get("#can-combobox-input").clear();
                        cy.get("#can-combobox-input").type("G99MVT3{enter}");
                        cy.get("#enteredAmount").clear();
                        cy.get("#enteredAmount").type("2_000_000");
                        cy.get('[data-cy="update-budget-line"]').click();
                        cy.get('[data-cy="continue-btn"]').click();
                        cy.get('[data-cy="alert"]').should("exist");
                        cy.get('[data-cy="alert"]')
                            .should(($alert) => {
                                expect($alert).to.contain(
                                    `The agreement ${testAgreement.display_name} has been successfully updated.`
                                );
                            })
                            .then(() => {
                                // verify the updated data is displayed in the table
                                cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                                cy.get("@table-rows")
                                    .eq(0)
                                    .should("contain", "$2,000,000.00")
                                    .and("contain", "2/2/2048")
                                    .and("contain", "G99MVT3");

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

    it("can edit an AA agreement budget lines", () => {
        expect(localStorage.getItem("access_token")).to.exist;

        // create test agreement
        const aaAgreement = {
            ...testAgreement,
            agreement_type: AGREEMENT_TYPES.AA,
            requesting_agency_id: 1,
            servicing_agency_id: 2
        };
        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
        cy.request({
            method: "POST",
            url: "http://localhost:8080/api/v1/agreements/",
            body: aaAgreement,
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
                })
                    .then((response) => {
                        expect(response.status).to.eq(201);
                        expect(response.body.id).to.exist;
                        const bliId = response.body.id;
                        return { agreementId, bliId };
                    })
                    .then(({ agreementId, bliId }) => {
                        cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                        cy.get("#edit").click();
                        cy.get("#servicesComponentSelect").select("1");
                        cy.get("#pop-start-date").type("01/01/2044");
                        cy.get("#pop-end-date").type("01/01/2045");
                        cy.get("#description").type("This is a description.");
                        cy.get("[data-cy='add-services-component-btn']").click();
                        cy.get("tbody").children().as("table-rows").should("have.length", 1);
                        cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                        cy.get("[data-cy='edit-row']").click();
                        cy.get("#allServicesComponentSelect").select("SC1");
                        cy.get("#need-by-date").clear();
                        cy.get("#need-by-date").type("02/02/2048");
                        cy.get("#can-combobox-input").clear();
                        cy.get("#can-combobox-input").type("G99MVT3{enter}");
                        cy.get("#enteredAmount").clear();
                        cy.get("#enteredAmount").type("2_000_000");
                        cy.get('[data-cy="update-budget-line"]').click();
                        cy.get('[data-cy="continue-btn"]').click();
                        cy.get('[data-cy="alert"]').should("exist");
                        cy.get('[data-cy="alert"]')
                            .should(($alert) => {
                                expect($alert).to.contain(
                                    `The agreement ${testAgreement.display_name} has been successfully updated.`
                                );
                            })
                            .then(() => {
                                // verify the updated data is displayed in the table
                                cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                                cy.get("@table-rows")
                                    .eq(0)
                                    .should("contain", "$2,000,000.00")
                                    .and("contain", "2/2/2048")
                                    .and("contain", "G99MVT3");

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

    it("can edit a Direct Obligation agreement budget lines", () => {
        expect(localStorage.getItem("access_token")).to.exist;

        // create test agreement
        const doAgreement = { ...testAgreement, agreement_type: AGREEMENT_TYPES.DIRECT_OBLIGATION };
        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
        cy.request({
            method: "POST",
            url: "http://localhost:8080/api/v1/agreements/",
            body: doAgreement,
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
                })
                    .then((response) => {
                        expect(response.status).to.eq(201);
                        expect(response.body.id).to.exist;
                        const bliId = response.body.id;
                        return { agreementId, bliId };
                    })
                    .then(({ agreementId, bliId }) => {
                        cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                        cy.get("#edit").click();
                        cy.get("#servicesComponentSelect").select("1");
                        cy.get("#pop-start-date").type("01/01/2044");
                        cy.get("#pop-end-date").type("01/01/2045");
                        cy.get("#description").type("This is a description.");
                        cy.get("[data-cy='add-services-component-btn']").click();
                        cy.get("tbody").children().as("table-rows").should("have.length", 1);
                        cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                        cy.get("[data-cy='edit-row']").click();
                        cy.get("#allServicesComponentSelect").select("SC1");
                        cy.get("#need-by-date").clear();
                        cy.get("#need-by-date").type("02/02/2048");
                        cy.get("#can-combobox-input").clear();
                        cy.get("#can-combobox-input").type("G99MVT3{enter}");
                        cy.get("#enteredAmount").clear();
                        cy.get("#enteredAmount").type("2_000_000");
                        cy.get('[data-cy="update-budget-line"]').click();
                        cy.get('[data-cy="continue-btn"]').click();
                        cy.get('[data-cy="alert"]').should("exist");
                        cy.get('[data-cy="alert"]')
                            .should(($alert) => {
                                expect($alert).to.contain(
                                    `The agreement ${testAgreement.display_name} has been successfully updated.`
                                );
                            })
                            .then(() => {
                                // verify the updated data is displayed in the table
                                cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                                cy.get("@table-rows")
                                    .eq(0)
                                    .should("contain", "$2,000,000.00")
                                    .and("contain", "2/2/2048")
                                    .and("contain", "G99MVT3");

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

    it("can edit a IAA agreement budget lines", () => {
        expect(localStorage.getItem("access_token")).to.exist;

        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
        cy.request({
            method: "POST",
            url: "http://localhost:8080/api/v1/agreements/",
            body: testIaaAgreement,
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
                })
                    .then((response) => {
                        expect(response.status).to.eq(201);
                        expect(response.body.id).to.exist;
                        const bliId = response.body.id;
                        return { agreementId, bliId };
                    })
                    .then(({ agreementId, bliId }) => {
                        cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                        cy.get("#edit").click();
                        cy.get("#servicesComponentSelect").select("1");
                        cy.get("#pop-start-date").type("01/01/2044");
                        cy.get("#pop-end-date").type("01/01/2045");
                        cy.get("#description").type("This is a description.");
                        cy.get("[data-cy='add-services-component-btn']").click();
                        cy.get("tbody").children().as("table-rows").should("have.length", 1);
                        cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                        cy.get("[data-cy='edit-row']").click();
                        cy.get("#allServicesComponentSelect").select("SC1");
                        cy.get("#need-by-date").clear();
                        cy.get("#need-by-date").type("02/02/2048");
                        cy.get("#can-combobox-input").clear();
                        cy.get("#can-combobox-input").type("G99MVT3{enter}");
                        cy.get("#enteredAmount").clear();
                        cy.get("#enteredAmount").type("2_000_000");
                        cy.get('[data-cy="update-budget-line"]').click();
                        cy.get('[data-cy="continue-btn"]').click();
                        cy.get('[data-cy="alert"]').should("exist");
                        cy.get('[data-cy="alert"]')
                            .should(($alert) => {
                                expect($alert).to.contain(
                                    `The agreement ${testAgreement.display_name} has been successfully updated.`
                                );
                            })
                            .then(() => {
                                // verify the updated data is displayed in the table
                                cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                                cy.get("@table-rows")
                                    .eq(0)
                                    .should("contain", "$2,000,000.00")
                                    .and("contain", "2/2/2048")
                                    .and("contain", "G99MVT3");

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

    it("can create and edit a draft budget line", () => {
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
                cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines?mode=edit`);
                cy.get("#servicesComponentSelect").select("1");
                // create service component
                cy.get("#pop-start-date").type("01/01/2044");
                cy.get("#pop-end-date").type("01/01/2045");
                cy.get("#description").type("This is a description.");
                cy.get("[data-cy='add-services-component-btn']").click();
                // create DRAFT budget line
                cy.get("#allServicesComponentSelect").select("SC1");
                cy.get("#enteredAmount").type("2_222_222");
                cy.get("#need-by-date").type("01/01/2048");
                cy.get("#can-combobox-input").type("G99MVT3{enter}");
                cy.get("#add-budget-line").click();
                // validate budget line creation
                cy.get("tbody").children().as("table-rows").should("have.length", 1);
                cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                cy.get("[data-cy='edit-row']").click();
                // edit DRAFT budget line
                cy.get("#need-by-date").clear();
                cy.get("#need-by-date").type("02/02/2048");
                cy.get("#enteredAmount").clear();
                cy.get("#enteredAmount").type("1_000_000");
                cy.get("#can-combobox-input").clear();
                cy.get("#can-combobox-input").type("G994426{enter}");
                cy.get('[data-cy="update-budget-line"]').click();
                cy.get('[data-cy="continue-btn"]').click();
                cy.get('[data-cy="alert"]').should("exist");
                cy.get('[data-cy="alert"]')
                    .should(($alert) => {
                        expect($alert).to.contain(
                            `The agreement ${testAgreement.display_name} has been successfully updated.`
                        );
                    })
                    .then(() => {
                        cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                        // get the first row from table-row and store the data-testid to a variable
                        // use the variable to delete the budget line below
                        cy.get("@table-rows")
                            .eq(0)
                            .invoke("attr", "data-testid")
                            .then((dataTestId) => {
                                const bliId = dataTestId.replace("budget-line-row-", ""); // Clean extraction
                                cy.request({
                                    method: "DELETE",
                                    url: `http://localhost:8080/api/v1/budget-line-items/${bliId}`,
                                    headers: {
                                        Authorization: bearer_token,
                                        Accept: "application/json"
                                    }
                                })
                                    .then((response) => {
                                        expect(response.status).to.eq(200);
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
});

describe("Change Requests with Power User", () => {
    beforeEach(() => {
        testLogin("system-owner");
    });

    it("cannot edit budget line when it is in review status", () => {
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
            // test interactions
            .then(({ agreementId, bliId }) => {
                // log out and log in as division director
                cy.contains("Sign-Out").click();
                cy.visit("/").wait(1000);
                testLogin("power-user");
                cy.visit(`http://localhost:3000/agreements/${agreementId}/budget-lines`);
                cy.get("#edit").click();
                cy.get("tbody").children().as("table-rows").should("have.length", 1);
                cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                cy.get("[data-cy='edit-row']")
                    .should("be.disabled")
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
