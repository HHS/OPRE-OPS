/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";

const testAgreement = {
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

            cy.intercept("PATCH", "**/agreements/**").as("patchAgreement");
            cy.visit(`/agreements/${agreementId}`);
            cy.get("h1").should("have.text", "Test Contract");
            cy.get('[data-cy="details-left-col"] > :nth-child(4)').should("have.text", "History");
            checkAgreementHistory();
            cy.get(
                '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
            ).should("exist");
            cy.get(
                '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
            ).should("have.text", "Agreement Created");
            cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]').should("exist");
            cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]').should(
                "have.text",
                "System Owner created a new agreement."
            );
            cy.get("#edit").click();
            cy.get("#edit").should("not.exist");
            cy.get('[data-cy="continue-btn"]').should("exist");
            cy.get("h1").should("have.text", "Test Contract");
            // test validation
            cy.get("#name").clear();
            cy.get("#name").blur();
            cy.get(".usa-error-message").should("contain", "This is required information");
            cy.get("[data-cy='continue-btn']").should("be.disabled");
            cy.get("#name").type("Test Edit Title");
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
            cy.get(".usa-alert__body").should("contain", "The agreement Test Edit Title has been successfully updated");
            cy.get("[data-cy='close-alert']").click();
            cy.get("h1").should("have.text", "Test Edit Title");
            cy.get("[data-cy='details-notes']").should("exist");
            cy.get("[data-cy='details-notes']").should("have.text", "Test Notes test edit notes");
            cy.get("#edit").should("exist");

            cy.get(
                '[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]'
            ).should("have.text", "Change to Name");
            cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > [data-cy="log-item-message"]').should(
                "have.text",
                "System Owner changed the name from Test Contract to Test Edit Title."
            );
            cy.get('[data-cy="agreement-history-list"] > :nth-child(2) > .flex-justify > .text-bold').should(
                "have.text",
                "Change to Notes"
            );
            cy.get('[data-cy="agreement-history-list"] > :nth-child(2) > [data-cy="log-item-message"]').should(
                "have.text",
                "System Owner changed the notes."
            );
            cy.get(
                '[data-cy="agreement-history-list"] > :nth-child(3) > .flex-justify > [data-cy="log-item-title"]'
            ).should("have.text", "Change to Description");
            cy.get('[data-cy="agreement-history-list"] > :nth-child(3) > [data-cy="log-item-message"]').should(
                "have.text",
                "System Owner changed the description."
            );

            // test alternate project officer has edit persmission
            cy.get('[data-cy="sign-out"]').click();
            cy.visit("/");
            cy.get("h1").contains("Sign in to your account");
            testLogin("budget-team");
            cy.visit("/agreements/");
            cy.contains("tbody tr", "Test Edit Title").as("agreement-row");
            cy.get("@agreement-row").contains("Test Edit Title").click();
            cy.get("#edit").should("exist");

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
            cy.get("h1").contains("Test Contract");
            cy.get("#edit").click();
            cy.get("#servicesComponentSelect").select("1");
            cy.get("#pop-start-date").type("01/01/2043");
            cy.get("#pop-end-date").type("01/01/2044");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("#allServicesComponentSelect").select(1);
            cy.get("#need-by-date").type("01/01/2044");
            cy.get("#can-combobox-input").click();
            cy.get(".can-combobox__option").first().click();
            cy.get("#enteredAmount").type("500000");
            cy.get("#add-budget-line").click();
            cy.get("[data-cy='continue-btn']").click();

            // Test Service Components as division director
            testLogin("division-director");
            cy.visit(`/agreements/${agreementId}`);
            cy.get("h1").contains("Test Contract");
            cy.get("[data-cy='division-director-tag']").should("contain", "Dave Director");
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("h1").contains("Test Contract");
            cy.get("#edit").click();
            cy.get("[data-cy='services-component-list'] > *").should("have.length", 1);
            cy.get("#servicesComponentSelect").select("2");
            cy.get("#pop-start-date").type("01/01/2044");
            cy.get("#pop-end-date").type("01/01/2045");
            cy.get("#description").type("This is a description.");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get(".usa-alert__body").should("contain", " Services Component 2 has been successfully added.");
            cy.get("[data-cy='services-component-list'] > *").should("have.length", 2);
            cy.get("[data-cy='services-component-list'] > :nth-child(2)").trigger("mouseover");
            cy.get("[data-cy='services-component-list'] > :nth-child(2)").within(() => {
                cy.get("[data-cy='services-component-item-edit-button']").should("be.visible").click();
            });
            cy.get("#pop-end-date").clear();
            cy.get("#pop-end-date").type("01/02/2045");
            cy.get("[data-cy='update-services-component-btn']").click();
            cy.get(".usa-alert__body").should("contain", " Services Component 2 has been successfully updated.");
            cy.get("[data-cy='services-component-list'] > :nth-child(2)").trigger("mouseover");
            cy.get("[data-cy='services-component-list'] > :nth-child(2)").within(() => {
                cy.get("[data-cy='services-component-item-delete-button']").should("be.visible").click();
            });
            cy.get(".usa-modal__heading").should("contain", "Are you sure you want to delete Services Component 2?");
            cy.get("[data-cy='confirm-action']").click();
            cy.get(".usa-alert__body").should("contain", "Services Component 2 has been successfully deleted.");
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
            cy.get("h1").should("have.text", "Test Contract");
            cy.get("#edit").click();
            cy.get("#servicesComponentSelect").select("1");
            cy.get("#pop-start-date").type("01/01/2043");
            cy.get("#pop-end-date").type("01/01/2044");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("#allServicesComponentSelect").select(1);
            cy.get("#need-by-date").type("01/01/2044");
            cy.get("#can-combobox-input").click();
            cy.get(".can-combobox__option").first().click();
            cy.get("#enteredAmount").type("500000");
            cy.get("#add-budget-line").click();
            cy.get("[data-cy='continue-btn']").click();

            testLogin("division-director");
            //Create
            cy.visit(`/agreements/${agreementId}`);
            cy.get("h1").should("have.text", "Test Contract");
            cy.get("[data-cy='division-director-tag']").should("contain", "Dave Director");
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("h1").should("have.text", "Test Contract");
            cy.get("#edit").click();
            cy.get("#allServicesComponentSelect").select(1);
            cy.get("#need-by-date").type("01/01/2044");
            cy.get("#can-combobox-input").click();
            cy.get(".can-combobox__option").first().click();
            cy.get("#enteredAmount").type("500000");
            cy.get("#add-budget-line").click();
            cy.get(".usa-alert__heading").should("contain", "Budget Line Added");
            cy.get("[data-cy='continue-btn']").click();
            cy.get(".usa-alert__heading").should("contain", "Agreement Updated");

            //Edit
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("h1").should("have.text", "Test Contract");
            cy.get("#edit").click();
            cy.get('[data-testid="budget-line-row-16049"]').trigger("mouseover");
            cy.get('[data-testid="budget-line-row-16049"]').get("[data-cy='edit-row']").click();
            cy.get("#enteredAmount").clear();
            cy.get("#enteredAmount").type("1000000");
            cy.get("[data-cy='update-budget-line']").click();
            cy.get(".usa-alert__heading").should("contain", "Budget Line Updated");
            cy.get("[data-cy='continue-btn']").click();
            cy.get(".usa-alert__heading").should("contain", "Agreement Updated");

            //Delete
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get("h1").should("have.text", "Test Contract");
            cy.get("#edit").click();
            cy.get('[data-testid="budget-line-row-16049"]').trigger("mouseover");
            cy.get('[data-testid="budget-line-row-16049"]').get("[data-cy='delete-row']").click();
            cy.get("#ops-modal-heading").should("contain", "Are you sure you want to delete budget line 16049");
            cy.get("[data-cy='confirm-action']").click();
            cy.get(".usa-alert__heading").should("contain", "Budget Line Deleted");
            cy.get("[data-cy='continue-btn']").click();
            cy.get(".usa-alert__heading").should("contain", "Agreement Updated");

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

const checkAgreementHistory = () => {
    cy.get("h3.history-title").should("have.text", "History");
    cy.get('[data-cy="agreement-history-container"]').should("exist");
    cy.get('[data-cy="agreement-history-container"]').scrollIntoView();
    cy.get('[data-cy="agreement-history-list"]').should("exist");
    cy.get('[data-cy="agreement-history-list"] > :nth-child(1) > .flex-justify > [data-cy="log-item-title"]').should(
        "exist"
    );
};
