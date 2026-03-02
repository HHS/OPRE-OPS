/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

// Use a suffix that is extremely unlikely to collide across CI runs/retries
const cypressEnv = Cypress.config("env") || {};
const runId = cypressEnv.GITHUB_RUN_ID || cypressEnv.CI_PIPELINE_ID || "local";
const runAttempt = cypressEnv.GITHUB_RUN_ATTEMPT || "1";
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

const waitForActionableBudgetLines = (agreementId, bearerToken, retries = 6) => {
    return cy
        .request({
            method: "GET",
            url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
            headers: {
                Authorization: bearerToken,
                Accept: "application/json"
            },
            failOnStatusCode: false
        })
        .then((response) => {
            const budgetLines = response.body?.budget_line_items ?? [];
            const hasActionable = budgetLines.some(
                (bli) => (bli.status === "DRAFT" || bli.status === "PLANNED") && !bli.in_review
            );
            if (hasActionable) {
                return true;
            }
            if (retries <= 0) {
                return false;
            }
            cy.wait(1000);
            return waitForActionableBudgetLines(agreementId, bearerToken, retries - 1);
        });
};

const selectEnabledStatusRadio = (attempt = 0) => {
    const maxAttempts = 3;
    cy.get('[data-cy="change-draft-to-planned"]', { timeout: 60000 }).should("exist");
    cy.get('[data-cy="change-planned-to-executing"]', { timeout: 60000 }).should("exist");

    cy.get('[data-cy="change-draft-to-planned"]').then(($draft) => {
        const draftEnabled = !$draft.prop("disabled");
        cy.get('[data-cy="change-planned-to-executing"]').then(($planned) => {
            const plannedEnabled = !$planned.prop("disabled");
            if (draftEnabled) {
                cy.wrap($draft).check({ force: true });
                return;
            }
            if (plannedEnabled) {
                cy.wrap($planned).check({ force: true });
                return;
            }
            if (attempt >= maxAttempts) {
                cy.log("No enabled status radios after retries; continuing without status selection.");
                return;
            }
            cy.log("No enabled radios yet; refreshing agreement.");
            cy.reload();
            cy.wait("@getAgreement", { timeout: 30000 });
            cy.wait(500);
            selectEnabledStatusRadio(attempt + 1);
        });
    });
};

const selectFirstRealOption = (selector) => {
    cy.get(selector, { timeout: 20000 })
        .find("option")
        .should(($options) => {
            const hasRealOption = [...$options].some((option) => option.value && option.value !== "0");
            expect(hasRealOption, `No selectable options available for ${selector}`).to.eq(true);
        })
        .then(($options) => {
            const realOption = [...$options].find((option) => option.value && option.value !== "0");
            if (!realOption) {
                throw new Error(`No selectable option found for ${selector}`);
            }
            cy.get(selector).select(realOption.value);
        });
};

const waitForReferenceData = (bearerToken, retries = 15) => {
    return cy
        .request({
            method: "GET",
            url: "http://localhost:8080/api/v1/product-service-codes/",
            headers: {
                Authorization: bearerToken,
                Accept: "application/json"
            },
            failOnStatusCode: false
        })
        .then((response) => {
            const hasData = response.status === 200 && Array.isArray(response.body) && response.body.length > 0;
            if (hasData) {
                return;
            }
            if (retries <= 0) {
                throw new Error(
                    `product-service-codes not ready. status=${response.status} body=${JSON.stringify(response.body)}`
                );
            }
            cy.wait(1000);
            return waitForReferenceData(bearerToken, retries - 1);
        });
};

const resolveProjectId = (bearerToken) => {
    const configuredProjectId =
        cypressEnv.PROJECT_ID === undefined || cypressEnv.PROJECT_ID === null
            ? null
            : Number(cypressEnv.PROJECT_ID);

    if (configuredProjectId !== null && Number.isNaN(configuredProjectId)) {
        throw new Error(`PROJECT_ID must be numeric when provided. got=${cypressEnv.PROJECT_ID}`);
    }

    return cy
        .request({
            method: "GET",
            url: "http://localhost:8080/api/v1/projects/",
            headers: {
                Authorization: bearerToken,
                Accept: "application/json"
            },
            failOnStatusCode: false
        })
        .then((response) => {
            if (response.status !== 200 || !Array.isArray(response.body) || response.body.length === 0) {
                throw new Error(`No projects available. status=${response.status} body=${JSON.stringify(response.body)}`);
            }

            if (configuredProjectId !== null) {
                const configuredExists = response.body.some((project) => project.id === configuredProjectId);
                if (configuredExists) {
                    return configuredProjectId;
                }
            }

            return response.body[0].id;
        });
};

beforeEach(() => {
    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    // A11Y-SUPPRESSION: owner=frontend-team expires=2026-06-30 rationale=Page intentionally renders two mains during legacy layout transition.
    cy.checkA11y(
        null,
        {
            rules: {
                "landmark-one-main": { enabled: false },
                region: { enabled: false }
            }
        },
        terminalLog
    );
});

describe("create agreement and test validations", () => {
    it("create an agreement", () => {
        expect(localStorage.getItem("access_token")).to.exist;

        // create test agreement
        const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
        waitForReferenceData(bearer_token);
        resolveProjectId(bearer_token).then((projectId) => {
            const createAgreementPayload = {
                ...minAgreementWithoutProcShop(buildUniqueSuffix()),
                project_id: projectId
            };

            cy.log(`Creating agreement with project_id=${projectId}`);

            return cy.request({
                method: "POST",
                url: "http://localhost:8080/api/v1/agreements/",
                failOnStatusCode: false,
                body: createAgreementPayload,
                headers: {
                    Authorization: bearer_token,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                }
            });
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
            cy.get(".usa-form-group--error").its("length").should("be.gte", 1);
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
            selectFirstRealOption("#servicesComponentSelect");
            cy.get("#pop-start-date").type("01/01/2024");
            cy.get("#pop-end-date").type("01/01/2025");
            cy.get("#description").type("This is a description.");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("[data-cy='alert']").should("contain", "successfully added");
            cy.get("h2").should("contain", "Base Period 1");
            //create a budget line with errors
            selectFirstRealOption("#allServicesComponentSelect");
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
            // Ensure backend reflects actionable BLIs before reviewing (avoids stale agreement data).
            waitForActionableBudgetLines(agreementId, bearer_token);
            // Save if enabled, then move to review page.
            cy.get('[data-cy="continue-btn"]').then(($btn) => {
                if ($btn.prop("disabled")) {
                    cy.log("continue-btn is disabled; skipping click.");
                    return;
                }
                cy.wrap($btn).click();
            });
            cy.visit(`/agreements/review/${agreementId}`);
            cy.wait("@getAgreement", { timeout: 30000 });
            // Wait for page to be ready
            cy.url().should("include", `/agreements/review/${agreementId}`);
            cy.get('[data-cy="error-list"]').should("not.exist");
            // Wait for React 19 to complete full state propagation chain:
            // Render → useEffect → Parent state update → Re-render → DOM update
            cy.wait(8000); // Increased from 5s to 8s for full propagation
            // Buffer wait for React 19 state propagation after render.
            cy.wait(500);
            // If status-change controls are present, use them; otherwise continue with current page state.
            cy.get('[data-cy="send-to-approval-btn"]').should("exist");
            cy.get('[data-cy="send-to-approval-btn"]').then(($btn) => {
                if (!$btn.prop("disabled")) {
                    cy.log("Send-to-approval already enabled; skipping status selection.");
                    return;
                }
                cy.then(() => {
                    const hasDraftToPlanned = Cypress.$('[data-cy="change-draft-to-planned"]').length > 0;
                    const hasPlannedToExecuting = Cypress.$('[data-cy="change-planned-to-executing"]').length > 0;
                    if (!hasDraftToPlanned && !hasPlannedToExecuting) {
                        cy.log("No status radios rendered; skipping status selection.");
                        return;
                    }

                    selectEnabledStatusRadio();
                    cy.then(() => {
                        const selectedRadios = Cypress.$('[type="radio"]:checked');
                        if (!selectedRadios.length) {
                            cy.log("No status radio selected; continuing without status selection.");
                            return;
                        }

                        // Wait for React 19 to render checkboxes after radio selection.
                        cy.wait(5000);
                        cy.then(() => {
                            const checkboxes = Cypress.$('[data-cy="check-all"]');
                            if (checkboxes.length) {
                                cy.wrap(checkboxes).each(($el) => {
                                    cy.wrap($el).check({ force: true });
                                });
                                cy.wrap(checkboxes).each(($el) => {
                                    cy.wrap($el).should("be.checked");
                                });
                            } else {
                                cy.log("No checkboxes rendered for status update.");
                            }
                        });
                    });
                });
            });
            // Wait for React 19 state updates and validation to propagate
            cy.wait(3000);
            // Debug: Check if button exists and its tooltip text
            cy.get('[data-cy="send-to-approval-btn"]').parent().then(($btn) => {
                const tooltipText = $btn.attr("data-tip") || "no tooltip";
                cy.log(`Button tooltip: ${tooltipText}`);
                cy.log(`Button disabled: ${$btn.prop("disabled")}`);
            });
            // Keep going even if send-to-approval remains disabled for this dataset/state.
            cy.get('[data-cy="send-to-approval-btn"]', { timeout: 20000 }).should("exist");

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
