/// <reference types="cypress" />

import { testLogin } from "./utils";
import { BLI_STATUS } from "../../src/helpers/budgetLines.helpers";

let testAgreement = {
    agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "E2E Save Changes To Edits",
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
    testAgreement.name = `E2E Save Changes To Edits ${uniqueId}`;

    testLogin("system-owner");
});

// afterEach(() => {
//     cy.injectAxe();
//     cy.checkA11y(null, null, terminalLog);
// });

describe("Save Changes/Edits in Agreement BLIs", () => {
    let agreementId;
    let bearer_token;

    beforeEach(() => {
        expect(localStorage.getItem("access_token")).to.exist;
        bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;

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
            agreementId = response.body.id;
        });
    });

    afterEach(() => {
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

    it("should save and exit via modal when navigating away within the app", () => {
        cy.visit(`/agreements/${agreementId}/budget-lines`);
        cy.get("#edit").click();
        cy.get("#editing").should("have.text", "Editing...");

        cy.get("#add-budget-line").click();
        cy.get(".usa-alert__text").should(
            "contain",
            "Budget line TBD was updated. When you're done editing, click Save & Exit below."
        );

        cy.get('[data-cy="unsaved-changes"]').should("exist");
        cy.contains("a", "Agreements").click();

        //Should exit the save & exit modal via ESC key"
        cy.get('body').type('{esc}');
        cy.get(".usa-modal__heading").should("not.exist");
        cy.get('[data-cy="unsaved-changes"]').should("exist");


        //Should save & exit correctly
        cy.contains("a", "Agreements").click();
        cy.get(".usa-modal__heading").should("contain", "Save changes before closing?");
        cy.get("[data-cy='confirm-action']").click();
        cy.get(".usa-modal__heading").should("not.exist");
        cy.get(".usa-alert__heading").should("contain", "Agreement Updated");
    });

    it("should continue without saving changes", () => {
        // Create a BLI
        const bliData = { ...testBli, agreement_id: agreementId };
        cy.request({
            method: "POST",
            url: "http://localhost:8080/api/v1/budget-line-items/",
            body: bliData,
            headers: {
                Authorization: bearer_token,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
        });

        cy.visit(`/agreements/${agreementId}/budget-lines`);
        cy.get("#edit").click();

        let budgetLineId;
        cy.get('[data-testid^="budget-line-row-"]')
            .first()
            .invoke("attr", "data-testid")
            .then((testId) => {
                budgetLineId = testId.split("row-")[1];
            });

        cy.then(() => {
            cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).trigger("mouseover");
            cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).get("[data-cy='edit-row']").click();
            cy.get("#enteredAmount").clear();
            cy.get("#enteredAmount").type("999999");
            cy.get("[data-cy='update-budget-line']").click();
            cy.get(".usa-alert__text").should(
                "contain",
                `Budget line ${budgetLineId} was updated.  When you’re done editing, click Save & Exit below.`
            );
            cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).should("contain", "$999,999.00");
            cy.contains("a", "Agreements").click();
            cy.get(".usa-modal__heading").should("contain", "Save changes before closing?");
            cy.get("[data-cy=cancel-action]").click();
            cy.get(".usa-alert__heading").should("not.exist", "Agreement Updated");
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).should("contain", "$0");
        });
    });

    it("should delete budget line item", () => {
        // Create a BLI
        const bliData = { ...testBli, agreement_id: agreementId };
        cy.request({
            method: "POST",
            url: "http://localhost:8080/api/v1/budget-line-items/",
            body: bliData,
            headers: {
                Authorization: bearer_token,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
        });

        cy.visit(`/agreements/${agreementId}/budget-lines`);
        cy.get("#edit").click();

        let budgetLineId;
        cy.get('[data-testid^="budget-line-row-"]')
            .first()
            .invoke("attr", "data-testid")
            .then((testId) => {
                budgetLineId = testId.split("row-")[1];
            });

        cy.then(() => {
            cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).trigger("mouseover");
            cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).get("[data-cy='delete-row']").click();
            cy.get(".usa-modal__heading").should(
                "contain",
                `Are you sure you want to delete budget line ${budgetLineId}?`
            );
            cy.get("[data-cy='confirm-action']").click();
            cy.get(".usa-alert__text").should(
                "contain",
                `The budget line ${budgetLineId} has been successfully deleted.`
            );
            cy.contains("a", "Agreements").click();
            cy.get(".usa-modal__heading").should("contain", "Save changes before closing?");
            cy.get("[data-cy='confirm-action']").click();
            cy.get(".usa-alert__heading").should("contain", "Agreement Updated");
            cy.visit(`/agreements/${agreementId}/budget-lines`);
            cy.get(`[data-testid="budget-line-row-${budgetLineId}"]`).should("not.exist");
        });
    });
});
