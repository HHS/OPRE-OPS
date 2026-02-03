/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

// Use a suffix that is extremely unlikely to collide across CI runs/retries
const runId = Cypress.env("GITHUB_RUN_ID") || Cypress.env("CI_PIPELINE_ID") || "local";
const runAttempt = Cypress.env("GITHUB_RUN_ATTEMPT") || "1";
const buildUniqueSuffix = () => `${runId}-${runAttempt}-${Date.now()}-${Cypress._.random(0, 1_000_000_000)}`;

const blData = [
    {
        services_component: "Base Period 1",
        can: "G99HRF2",
        needByDate: "09/01/2048",
        amount: 111111,
        line_description: "test line description"
    }
];

const minAgreementWithoutProcShop = (uniqueSuffix) => ({
    agreement_type: "CONTRACT",
    name: `Test Contract ${uniqueSuffix}`
    // project_id injected at runtime (varies by env)
    // remove awarding entity id so no procurement shop selected
});

beforeEach(() => {
    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("create agreement and test validations", () => {
    it("create an agreement", () => {
        expect(localStorage.getItem("access_token")).to.exist;

        // CI databases often differ; prefer an explicit PROJECT_ID when available
        const projectId = Number(Cypress.env("PROJECT_ID") ?? 1000);
        expect(projectId, "PROJECT_ID must be a valid number").to.be.a("number").and.not.satisfy(Number.isNaN);

        const createAgreementPayload = {
            ...minAgreementWithoutProcShop(buildUniqueSuffix()),
            project_id: projectId
        };

        cy.log(`Creating agreement with project_id=${projectId}`);

        // create test agreement
        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
        cy.request({
            method: "POST",
            url: "http://localhost:8080/api/v1/agreements/",
            failOnStatusCode: false,
            body: createAgreementPayload,
            headers: {
                Authorization: bearer_token,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        }).then((response) => {
            if (response.status !== 201) {
                // Make failures actionable in CI logs
                throw new Error(
                    `Failed to create agreement. status=${response.status} body=${JSON.stringify(response.body)}`
                );
            }
            expect(response.body.id).to.exist;
            const agreementId = response.body.id;

            // Set up intercepts before visiting the page
            cy.intercept("GET", `**/agreements/${agreementId}**`).as("getAgreement");
            cy.intercept("PATCH", "**/agreements/**").as("patchAgreement");
            cy.intercept("GET", "**/cans/**").as("getCans");
            cy.intercept("GET", "**/budget-line-items/**").as("getBudgetLines");

            // Visit page and wait for agreement to load
            cy.visit(`/agreements/review/${agreementId}?mode=review`);
            cy.wait("@getAgreement", { timeout: 30000 });
            // Give React time to render after data loads
            cy.wait(300);
            // Wait for send-to-approval button to be disabled
            cy.get('[data-cy="send-to-approval-btn"]', { timeout: 10000 }).should("be.disabled");
            //fix errors
            cy.get('[data-cy="edit-agreement-btn"]').click();
            cy.get("#continue").click();
            // get all errors on page
            cy.get(".usa-form-group--error").should("have.length", 7);
            // test description
            cy.get("#description").type("Test Description");
            cy.get("#description").clear();
            cy.get("#description").blur();
            cy.get(".usa-error-message").should("exist");
            cy.get("#description").type("Test Description");
            // test contract type
            cy.get("#contract-type").select("Firm Fixed Price (FFP)");
            cy.get("#contract-type").select("-Select an option-");
            cy.get(".usa-error-message").should("exist");
            cy.get("#contract-type").select("Firm Fixed Price (FFP)");
            // test service requirement select
            cy.get("#service_requirement_type").select("Severable");
            cy.get("#service_requirement_type").select("-Select Service Requirement Type-");
            cy.get(".usa-error-message").should("exist");
            cy.get("#service_requirement_type").select("Severable");
            // test product service code
            cy.get("#product_service_code_id").select(1);
            cy.get("#product_service_code_id").select(0);
            cy.get(".usa-error-message").should("exist");
            cy.get("#product_service_code_id").select(1);
            // test procurement shop
            cy.get("#procurement-shop-select").select(2);
            cy.get("#procurement-shop-select").select("-Select Procurement Shop-");
            cy.get(".usa-error-message").should("exist");
            cy.get("#procurement-shop-select").select(2);
            // test agreement type
            cy.get("#agreement_reason").select("NEW_REQ");
            cy.get("#agreement_reason").select(0);
            cy.get(".usa-error-message").should("exist");
            cy.get("#agreement_reason").select("NEW_REQ");
            cy.get("#project-officer-combobox-input").type("Chris Fortunato{enter}");
            cy.get("#team-member-combobox-input").type("System Owner{enter}");
            cy.get("#agreementNotes").type("This is a note.");
            cy.get("[data-cy='continue-btn']").click();
            //  Add Services Component
            cy.get("p").should("contain", "You have not added any Services Component yet.");
            cy.get("#servicesComponentSelect").select("1");
            cy.get("#pop-start-date").type("01/01/2024");
            cy.get("#pop-end-date").type("01/01/2025");
            cy.get("#description").type("This is a description.");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("[data-cy='alert']").should("contain", "successfully added");
            cy.get("h2").should("contain", "Base Period 1");
            //create a budget line with errors
            cy.get("#allServicesComponentSelect").select(`${blData[0].services_component}`);
            // Wait for CAN combobox to finish loading CANs
            cy.contains("Loading...").should("not.exist");
            cy.get("#can-combobox-input").should("not.be.disabled");
            // add a CAN and clear it
            cy.get("#can-combobox-input").type(`${blData[0].can}{enter}`);
            cy.get(".can-combobox__clear-indicator").click();
            cy.get(".usa-error-message").should("exist");
            cy.get("#can-combobox-input").type(`${blData[0].can}{enter}`);
            // ensure date is in the future
            cy.get("#need-by-date").type("09/01/1998{enter}");
            // check for date to be in the future  which should error
            cy.get(".usa-error-message").should("exist");
            // fix by adding a valid date
            cy.get("#need-by-date").clear();
            // test for invalid date
            cy.get("#need-by-date").type("tacocat");
            cy.get(".usa-error-message").should("exist");
            // fix by adding a valid date
            cy.get("#need-by-date").clear();
            cy.get("#need-by-date").type(blData[0].needByDate);
            // add entered amount and clear it
            cy.get("#enteredAmount").type(`${blData[0].amount}`);
            cy.get("#enteredAmount").clear();
            cy.get(".usa-error-message").should("exist");
            cy.get("#enteredAmount").type("123");
            // add description and clear it
            cy.get("#enteredDescription").type(`${blData[0].line_description}`);
            cy.get("#enteredDescription").clear();
            cy.get("#input-error-message").should("not.exist");
            cy.get("#enteredDescription").type(`${blData[0].line_description}`);
            cy.get("#add-budget-line").should("not.be.disabled");
            // add budget line
            cy.get("#add-budget-line").click();
            cy.get(".usa-alert__text").should(
                "contain",
                "Budget line TBD was updated. When you're done editing, click Create Agreement below."
            );
            // go back to review page
            cy.get('[data-cy="continue-btn"]').click();
            // Wait for navigation and agreement data to load
            cy.visit(`/agreements/review/${agreementId}`);
            cy.wait("@getAgreement", { timeout: 30000 });
            // Wait for page to be ready
            cy.url().should("include", `/agreements/review/${agreementId}`);
            cy.get('[data-cy="error-list"]').should("not.exist");
            // click option and check all budget lines
            cy.get('[type="radio"]', { timeout: 10000 }).first().should("be.visible");
            cy.get('[type="radio"]').first().check({ force: true });
            // Wait for React 19 to process the radio selection
            cy.wait(1000);
            // Verify radio is checked before proceeding
            cy.get('[type="radio"]').first().should("be.checked");
            // Wait for React 19 to render checkboxes after radio selection - React 19 is significantly slower
            cy.wait(4000);
            // Wait for checkboxes to appear after radio selection with extended timeout
            cy.get('[data-cy="check-all"]', { timeout: 60000 }).should("exist").and("be.visible");
            cy.get('[data-cy="check-all"]').each(($el) => {
                cy.wrap($el).check({ force: true });
            });
            // Verify all checkboxes are checked
            cy.get('[data-cy="check-all"]').each(($el) => {
                cy.wrap($el).should("be.checked");
            });
            // Wait for React 19 state updates and validation to propagate
            // Give extra time for validation checks to complete
            cy.wait(3000);
            // Debug: Check if button exists and its tooltip text
            cy.get('[data-cy="send-to-approval-btn"]').should("exist");
            cy.get('[data-cy="send-to-approval-btn"]').parent().then(($btn) => {
                const tooltipText = $btn.attr("data-tip") || "no tooltip";
                cy.log(`Button tooltip: ${tooltipText}`);
                cy.log(`Button disabled: ${$btn.prop("disabled")}`);
            });
            // Use longer timeout for button state change as validation may be async
            cy.get('[data-cy="send-to-approval-btn"]', { timeout: 20000 }).should("not.be.disabled");

            // go back to edit mode and look for budget line errors
            cy.visit(`/agreements/edit/${agreementId}?mode=edit`);
            cy.get("#continue").click();
            cy.get(".usa-form-group--error").should("not.exist");
            cy.get('[data-cy="continue-btn"]').click();
            // add incomplete budget line
            cy.get("#allServicesComponentSelect").select(`${blData[0].services_component}`);
            cy.get("#add-budget-line").should("not.be.disabled");
            cy.get("#add-budget-line").click();
            cy.get(".usa-alert__text").should(
                "contain",
                "Budget line TBD was updated. When you're done editing, click Create Agreement below."
            );
            // patch agreement
            cy.get('[data-cy="continue-btn"]').click();
            //check for new budget line errors
            cy.visit(`/agreements/review/${agreementId}?mode=review`);
            cy.wait("@getAgreement", { timeout: 30000 });
            // Give React time to render after data loads
            cy.wait(300);

            //send-to-approval button should be disabled
            cy.get('[data-cy="send-to-approval-btn"]', { timeout: 10000 }).should("be.disabled");

            // fix errors
            cy.get('[data-cy="edit-agreement-btn"]').click();
            cy.get("#continue").click();
            cy.get('[data-cy="continue-btn"]').click();
            // check for new budget line errors
            cy.get(".usa-form-group--error").should("exist");
            cy.get("tbody").children().as("table-rows").should("have.length", 2);
            cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
            cy.get("[data-cy='edit-row']").click();
            cy.get(".usa-form-group--error").should("have.length", 4);
            cy.get('[data-cy="update-budget-line"]').should("be.disabled");
            // fix errors
            // Wait for CAN combobox to finish loading CANs
            cy.contains("Loading...").should("not.exist");
            cy.get("#can-combobox-input").should("not.be.disabled");
            cy.get("#can-combobox-input").type(`${blData[0].can}{enter}`);
            cy.get("#allServicesComponentSelect").select(`${blData[0].services_component}`);
            cy.get("#need-by-date").type(`${blData[0].needByDate}`);
            cy.get("#enteredAmount").type(`${blData[0].amount}`);
            cy.get("#enteredDescription").type(`${blData[0].line_description}`);
            cy.get('[data-cy="update-budget-line"]').should("not.be.disabled");
            cy.get('[data-cy="update-budget-line"]').click();
            cy.get(".usa-alert__text").should("contain", "was updated");
            cy.get(".usa-form-group--error").should("not.exist");
            // patch agreement
            cy.get('[data-cy="continue-btn"]').click();
            //check review page
            cy.visit(`/agreements/review/${agreementId}?mode=review`);
            cy.wait("@getAgreement", { timeout: 30000 });
            // Wait for page to render
            cy.get("h1", { timeout: 20000 }).should("be.visible").and("not.have.text", "Please resolve the errors outlined below");
            cy.get('[data-cy="error-list"]').should("not.exist");

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
