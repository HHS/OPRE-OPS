/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

const HISTORY_POLL_INTERVAL_MS = 1000;
const HISTORY_TIMEOUT_MS = 20000;

const waitForAgreementHistory = (agreementId, bearer_token, startedAt = Date.now()) => {
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
            const elapsedMs = Date.now() - startedAt;
            if (elapsedMs >= HISTORY_TIMEOUT_MS) {
                expect(response.status, "agreement history status").to.eq(200);
                expect(response.body, "agreement history entries").to.be.an("array").and.have.length.greaterThan(0);
                return;
            }
            cy.wait(HISTORY_POLL_INTERVAL_MS);
            return waitForAgreementHistory(agreementId, bearer_token, startedAt);
        });
};

let testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "Test Contract",
    description: "Test Description",
    project_id: 1000,
    product_service_code_id: 1,
    awarding_entity_id: 2,
    project_officer_id: 500,
    alternate_project_officer_id: 523,
    service_requirement_type: "NON_SEVERABLE",
    team_members: [
        {
            id: 502
        },
        {
            id: 504
        }
    ],
    notes: "Test Notes"
};

beforeEach(() => {
    // append a unique identifier to the agreement name to avoid conflicts
    const uniqueId = Date.now();
    testAgreement.name = `Test Contract ${uniqueId}`;

    testLogin("system-owner");
});
afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});
describe("Agreement Details Edit", () => {
    it("edit an agreement", () => {
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
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
            const agreementId = response.body.id;
            const editedTitle = `Test Edit Title ${Date.now()}`;

            waitForAgreementHistory(agreementId, bearer_token);
            cy.intercept("PATCH", "**/agreements/**").as("patchAgreement");
            cy.visit(`/agreements/${agreementId}`);
            cy.get("h1").should("have.text", testAgreement.name);
            cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
            checkAgreementHistory();
            cy.get("#edit").click();
            cy.get("#edit").should("not.exist");

            // add research methodology
            cy.get("#research-methodologies-combobox-input").type("Knowledge Development{enter}");
            // add special topics
            cy.get("#special-topics-combobox-input").type("Special Topic 1{enter}");
            cy.get("#special-topics-combobox-input").type("Special Topic 2{enter}");
            cy.get('[data-cy="continue-btn"]').should("exist");
            cy.get("h1").should("have.text", testAgreement.name);
            // test validation
            cy.get("#name").clear();
            cy.get("#name").blur();
            cy.get(".usa-error-message").should("contain", "This is required information");
            cy.get("[data-cy='continue-btn']").should("be.disabled");
            cy.get("#name").type(editedTitle);
            cy.get(".usa-error-message").should("not.exist");
            cy.get("[data-cy='continue-btn']").should("not.be.disabled");
            cy.get("#description").type(" more text");
            cy.get("#agreementNotes").type(" test edit notes");
            cy.get("[data-cy='continue-btn']").click();

            cy.wait("@patchAgreement")
                .then((interception) => {
                    const { statusCode, body } = interception.response;
                    expect(statusCode).to.equal(200);
                    expect(body.message).to.equal("Agreement updated");
                })
                .then(cy.log);
            cy.get(".usa-alert__body").should(
                "contain",
                `The agreement ${editedTitle} has been successfully updated`
            );
            cy.get("[data-cy='close-alert']").click();
            cy.get("h1").should("have.text", editedTitle);
            cy.get("[data-cy='details-notes']").should("exist");
            cy.get("[data-cy='details-notes']").should("have.text", "Test Notes test edit notes");
            cy.get("#edit").should("exist");

            waitForAgreementHistory(agreementId, bearer_token);
            cy.reload();
            checkAgreementHistory();
            cy.get('[data-cy="agreement-history-list"]')
                .invoke("text")
                .then((text) => {
                    const historyText = text.replace(/\s+/g, " ").trim();
                    const expectedEntries = [
                        "Change to Description",
                        "System Owner edited the agreement description.",
                        "Change to Agreement Title",
                        `System Owner changed the agreement title from ${testAgreement.name} to ${editedTitle}.`,
                        "Change to Notes",
                        "System Owner changed the notes.",
                        "Change to Research Methodologies",
                        "System Owner added Research Methodology Knowledge Development.",
                        "Change to Special Topic/Population Studied",
                        "System Owner added Special Topic/Population Studied Special Topic 1.",
                        "System Owner added Special Topic/Population Studied Special Topic 2."
                    ];
                    expectedEntries.forEach((entry) => {
                        expect(historyText).to.contain(entry);
                    });
                });

            // test alternate project officer has edit persmission
            cy.get('[data-cy="sign-out"]').click();
            cy.visit("/");
            cy.get("h1").contains("Sign in to your account");
            testLogin("budget-team");
            cy.visit(`/agreements/${agreementId}`);
            cy.get("#edit", { timeout: 10000 }).should("exist");

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

describe("Budget Line Items and Services Component CRUD", () => {
    it("should allow Division Director or Budget Team to edit Services Components", () => {
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
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
            const agreementId = response.body.id;

            testLogin("system-owner");
            //Create bli that have Dave Director as division director
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("h1").contains(testAgreement.name);
            cy.get("#edit").click();
            cy.get("#servicesComponentSelect").select("1");
            cy.get("#pop-start-date").type("01/01/2043");
            cy.get("#pop-end-date").type("01/01/2044");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("#allServicesComponentSelect").select(1);
            cy.get("#need-by-date").type("01/01/2044");
            // Wait for CAN combobox to finish loading CANs
            cy.contains("Loading...").should("not.exist");
            cy.get("#can-combobox-input").should("not.be.disabled");
            cy.get("#can-combobox-input").type("G994426{enter}");
            cy.get("#enteredAmount").type("500000");
            cy.get("#add-budget-line").click();
            cy.get(".usa-alert__text").should(
                "contain",
                "Budget line TBD was updated. When you're done editing, click Save & Exit below."
            );
            cy.get("[data-cy='continue-btn']").click();
            cy.get(".usa-alert__heading").should("contain", "Agreement Updated");

            // Test Service Components as division director
            testLogin("division-director");
            cy.visit(`/agreements/${agreementId}`);
            cy.get("h1").contains(testAgreement.name);
            cy.get("[data-cy='division-director-tag']").should("contain", "Dave Director");
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("h1").contains(testAgreement.name);
            cy.get("#edit").click();
            cy.get("[data-cy='services-component-list'] > *").should("have.length", 1);
            cy.get("#servicesComponentSelect").select("2");
            cy.get("#pop-start-date").type("01/01/2044");
            cy.get("#pop-end-date").type("01/01/2045");
            cy.get("#description").type("This is a description.");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("[data-cy='alert']").should("contain", "Services Component 2 has been successfully added");
            cy.get("[data-cy='services-component-list'] > *").should("have.length", 2);
            cy.get("[data-cy='services-component-list'] > :nth-child(2)").trigger("mouseover");
            cy.get("[data-cy='services-component-list'] > :nth-child(2)").within(() => {
                cy.get("[data-cy='services-component-item-edit-button']").should("be.visible").click();
            });
            cy.get("#pop-end-date").clear();
            cy.get("#pop-end-date").type("01/02/2045");
            cy.get("[data-cy='update-services-component-btn']").click();
            cy.get("[data-cy='alert']").should("contain", "Services Component 2 has been successfully updated.");
            cy.get("[data-cy='services-component-list'] > :nth-child(2)").trigger("mouseover");
            cy.get("[data-cy='services-component-list'] > :nth-child(2)").within(() => {
                cy.get("[data-cy='services-component-item-delete-button']").should("be.visible").click();
            });
            cy.get(".usa-modal__heading").should("contain", "Are you sure you want to delete Services Component 2?");
            cy.get("[data-cy='confirm-action']").click();
            cy.get("[data-cy='alert']").should("contain", "Services Component 2 has been successfully deleted.");
            cy.get("[data-cy='services-component-list'] > *").should("have.length", 1);

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

    it("should allow Division Director or Budget Team to edit Budget Lines", () => {
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
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
            const agreementId = response.body.id;

            testLogin("system-owner");
            //Create bli that have Dave Director as division director
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("h1").should("have.text", testAgreement.name);
            cy.get("#edit").click();
            cy.get("#servicesComponentSelect").select("1");
            cy.get("#pop-start-date").type("01/01/2043");
            cy.get("#pop-end-date").type("01/01/2044");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("#allServicesComponentSelect").select(1);
            cy.get("#need-by-date").type("01/01/2044");
            // Wait for CAN combobox to finish loading CANs
            cy.contains("Loading...").should("not.exist");
            cy.get("#can-combobox-input").should("not.be.disabled");
            cy.get("#can-combobox-input").type("G994426{enter}");
            cy.get("#enteredAmount").type("500000");
            cy.get("#add-budget-line").click();
            cy.get(".usa-alert__text").should(
                "contain",
                "Budget line TBD was updated. When you're done editing, click Save & Exit below."
            );
            cy.get("[data-cy='continue-btn']").click();
            cy.get(".usa-alert__heading").should("contain", "Agreement Updated");

            testLogin("division-director");
            //Create
            cy.visit(`/agreements/${agreementId}`);
            cy.get("h1").should("have.text", testAgreement.name);
            cy.get("[data-cy='division-director-tag']").should("contain", "Dave Director");
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("h1").should("have.text", testAgreement.name);
            cy.get("#edit").click();
            cy.get("#allServicesComponentSelect").select(1);
            cy.get("#need-by-date").type("01/01/2044");
            cy.get("#can-combobox-input").type("G994426{enter}");
            cy.get("#enteredAmount").type("500000");
            cy.get("#add-budget-line").click();
            cy.get(".usa-alert__text").should(
                "contain",
                "Budget line TBD was updated. When you're done editing, click Save & Exit below."
            );
            cy.get("[data-cy='continue-btn']").click();
            cy.get(".usa-alert__heading").should("contain", "Agreement Updated");

            //Edit
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("h1").should("have.text", testAgreement.name);
            cy.get("#edit").click();
            // Wait for edit mode to fully render
            cy.waitForEditingState(true);

            /// Get the BLIs Id.
            let budgetLineId;
            cy.get('[data-testid^="budget-line-row-"]')
                .first()
                .invoke("attr", "data-testid")
                .then((testId) => {
                    budgetLineId = testId.split("row-")[1];
                });

            cy.then(() => {
                cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).trigger("mouseover");
                cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).find("[data-cy='edit-row']").click();
                cy.get("#enteredAmount").clear();
                cy.get("#enteredAmount").type("1000000");
                cy.get("[data-cy='update-budget-line']").click();
                cy.get(".usa-alert__text").should(
                    "contain",
                    `Budget line ${budgetLineId} was updated.  When you’re done editing, click Save & Exit below.`
                );
                cy.get("[data-cy='continue-btn']").click();
                cy.get(".usa-alert__heading").should("contain", "Agreement Updated");

                //Delete
                cy.visit(`/agreements/${agreementId}/budget-lines`);
                cy.get("h1").should("have.text", testAgreement.name);
                cy.get("#edit").click();
                // Wait for edit mode to fully render
                cy.waitForEditingState(true);
                cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).trigger("mouseover");
                cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).find("[data-cy='delete-row']").click();
                cy.get("#ops-modal-heading").should(
                    "contain",
                    `Are you sure you want to delete budget line ${budgetLineId}`
                );
                cy.get("[data-cy='confirm-action']").click();
                console.log(budgetLineId);
                cy.get(".usa-alert__text").should(
                    "contain",
                    `The budget line ${budgetLineId} has been successfully deleted.`
                );
                cy.get("[data-cy='continue-btn']").click();
                cy.get(".usa-alert__heading").should("contain", "Agreement Updated");
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

describe("Awarded Agreement", () => {
    it("should disable fields when a contract agreement is awarded", () => {
        cy.visit(`/agreements/10?mode=edit`);

        // Verify all immutable fields are disabled
        cy.get("#agreement-type-filter").should("be.disabled");
        cy.get("#name").should("be.disabled");
        cy.get("#contract-type").should("be.disabled");
        cy.get("#service_requirement_type").should("be.disabled");
        cy.get("#product_service_code_id").should("be.disabled");
        cy.get("#agreement_reason").should("be.disabled");
        cy.get("#procurement-shop-select").should("be.disabled");
    });

    it("should allow power user to edit awarded contract agreement fields", () => {
        testLogin("power-user");
        cy.visit(`/agreements/10?mode=edit`);

        // agreement type should remain disabled (cannot be changed after creation)
        cy.get("#agreement-type-filter").should("be.disabled");

        // all other fields should NOT be disabled for power user
        cy.get("#name").should("not.be.disabled");
        cy.get("#contract-type").should("not.be.disabled");
        cy.get("#service_requirement_type").should("not.be.disabled");
        cy.get("#product_service_code_id").should("not.be.disabled");
        cy.get("#agreement_reason").should("not.be.disabled");
        cy.get("#procurement-shop-select").should("not.be.disabled");
    });

    it("should disable fields when a AA agreement is awarded", () => {
        cy.visit(`/agreements/12?mode=edit`);

        // Verify all immutable fields are disabled
        cy.get("#agreement-type-filter").should("be.disabled");
        cy.get("#name").should("be.disabled");
        cy.get("#contract-type").should("be.disabled");
        cy.get("#service_requirement_type").should("be.disabled");
        cy.get("#product_service_code_id").should("be.disabled");
        cy.get("#agreement_reason").should("be.disabled");
        cy.get("#procurement-shop-select").should("be.disabled");
        cy.get("#requesting-agency-combobox-input").should("be.disabled");
        cy.get("#servicing-agency-combobox-input").should("be.disabled");
    });

    it("should allow agreement team member to edit awarded AA agreement ", () => {
        cy.visit(`/agreements/12?mode=edit`);
        cy.get("#agreementNotes").clear();
        cy.get("#agreementNotes").type("Adding notes as agreement team member.");
        cy.get("[data-cy='continue-btn']").click();
        // verify notes are added
        cy.get("[data-cy='details-notes']").should("contain", "Adding notes as agreement team member.");
        checkAgreementHistory();
        cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]').should(
            "have.text",
            "System Owner changed the notes."
        );
    });

    it("should allow power user to edit awarded AA agreement fields", () => {
        testLogin("power-user");
        cy.visit(`/agreements/12?mode=edit`);

        // agreement type should remain disabled (cannot be changed after creation)
        cy.get("#agreement-type-filter").should("be.disabled");

        // all other fields should NOT be disabled for power user
        cy.get("#name").should("not.be.disabled");
        cy.get("#contract-type").should("not.be.disabled");
        cy.get("#service_requirement_type").should("not.be.disabled");
        cy.get("#product_service_code_id").should("not.be.disabled");
        cy.get("#agreement_reason").should("not.be.disabled");
        cy.get("#procurement-shop-select").should("not.be.disabled");
        cy.get("#requesting-agency-combobox-input").should("not.be.disabled");
        cy.get("#servicing-agency-combobox-input").should("not.be.disabled");

        cy.get("#agreementNotes").clear();
        cy.get("#agreementNotes").type("Adding notes as agreement power user.");
        cy.get("[data-cy='continue-btn']").click();
        // verify notes are added
        cy.get("[data-cy='details-notes']").should("contain", "Adding notes as agreement power user.");
        checkAgreementHistory();
        cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]').should(
            "have.text",
            "Power User changed the notes."
        );
    });
});

const checkAgreementHistory = () => {
    cy.get("h3.history-title").should("have.text", "History");
    cy.get('[data-cy="agreement-history-container"]').should("exist");
    cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
    cy.get('[data-cy="agreement-history-list"]', { timeout: 60000 }).should("exist");
    cy.get('[data-cy="agreement-history-list"] > :nth-child(1)', { timeout: 60000 }).should("exist");
    cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]', {
        timeout: 60000
    }).should("exist");
};
