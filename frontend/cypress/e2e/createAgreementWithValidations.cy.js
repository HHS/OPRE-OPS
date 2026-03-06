/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

const cypressEnv = Cypress.config("env") || {};
const runId = cypressEnv.GITHUB_RUN_ID || cypressEnv.CI_PIPELINE_ID || "local";
const runAttempt = cypressEnv.GITHUB_RUN_ATTEMPT || "1";
const buildUniqueSuffix = () => `${runId}-${runAttempt}-${Date.now()}-${Cypress._.random(0, 1_000_000_000)}`;

const createdAgreementIds = [];

const agreementDetailsData = {
    description: "Test Description",
    contract_type: "FIRM_FIXED_PRICE",
    service_requirement_type: "NON_SEVERABLE",
    product_service_code_id: 1,
    awarding_entity_id: 2,
    agreement_reason: "NEW_REQ",
    project_officer_id: 500,
    team_members: [{ id: 502 }, { id: 504 }],
    notes: "This is a note.",
    vendor: "Test Vendor"
};

const servicesComponentData = {
    number: 1,
    optional: false,
    description: "This is a description.",
    period_start: "2024-01-01",
    period_end: "2025-01-01"
};

const budgetLineData = {
    can_id: 504,
    date_needed: "2048-09-01",
    amount: 111111,
    line_description: "test line description"
};

const getBearerToken = () => `Bearer ${window.localStorage.getItem("access_token")}`;

const getAuthHeaders = () => ({
    Authorization: getBearerToken(),
    Accept: "application/json"
});

const getJsonHeaders = () => ({
    ...getAuthHeaders(),
    "Content-Type": "application/json"
});

const minAgreementWithoutProcShop = (uniqueSuffix) => ({
    agreement_type: "CONTRACT",
    name: `Test Contract ${uniqueSuffix}`
});

const resolveProjectId = () => {
    const explicitProjectId = Number(cypressEnv.PROJECT_ID);
    if (Number.isInteger(explicitProjectId) && explicitProjectId > 0) {
        return cy.wrap(explicitProjectId);
    }

    return cy
        .request({
            method: "GET",
            url: "http://localhost:8080/api/v1/projects/",
            headers: getAuthHeaders(),
            failOnStatusCode: false
        })
        .then((response) => {
            if (response.status !== 200 || !Array.isArray(response.body) || response.body.length === 0) {
                throw new Error(
                    `Failed to resolve a project id. status=${response.status} body=${JSON.stringify(response.body)}`
                );
            }

            const firstValidProject = response.body.find((project) => Number.isInteger(project?.id) && project.id > 0);
            if (!firstValidProject) {
                throw new Error(`No valid project id found in projects response: ${JSON.stringify(response.body)}`);
            }

            return firstValidProject.id;
        });
};

const createAgreement = (overrides = {}) => {
    return resolveProjectId().then((projectId) => {
        const payload = {
            ...minAgreementWithoutProcShop(buildUniqueSuffix()),
            project_id: projectId,
            ...overrides
        };

        return cy
            .request({
                method: "POST",
                url: "http://localhost:8080/api/v1/agreements/",
                failOnStatusCode: false,
                body: payload,
                headers: getJsonHeaders()
            })
            .then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body.id).to.exist;
                createdAgreementIds.push(response.body.id);
                return response.body.id;
            });
    });
};

const createValidAgreement = () => createAgreement(agreementDetailsData);

const createServicesComponent = (agreementId, overrides = {}) => {
    return cy
        .request({
            method: "POST",
            url: "http://localhost:8080/api/v1/services-components/",
            body: {
                agreement_id: agreementId,
                ...servicesComponentData,
                ...overrides
            },
            headers: getJsonHeaders()
        })
        .then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
            return response.body.id;
        });
};

const createBudgetLineItem = (agreementId, servicesComponentId, overrides = {}) => {
    return cy
        .request({
            method: "POST",
            url: "http://localhost:8080/api/v1/budget-line-items/",
            body: {
                agreement_id: agreementId,
                services_component_id: servicesComponentId,
                status: "DRAFT",
                ...budgetLineData,
                ...overrides
            },
            headers: getJsonHeaders()
        })
        .then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.id).to.exist;
            return response.body.id;
        });
};

const deleteCreatedAgreements = () => {
    if (!createdAgreementIds.length) {
        return;
    }

    cy.wrap(createdAgreementIds.splice(0)).each((agreementId) => {
        cy.request({
            method: "DELETE",
            url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
            headers: getAuthHeaders(),
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(200);
        });
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
                throw new Error("No enabled status radios after retries.");
            }

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

const selectComboboxOption = (inputSelector, menuSelector, optionSelector, preferredText, fallbackIndex = 0) => {
    cy.get(inputSelector, { timeout: 20000 })
        .should("not.be.disabled")
        .click()
        .type(preferredText, { force: true });

    cy.get(menuSelector, { timeout: 20000 })
        .should("be.visible")
        .then(($menu) => {
            const preferredOption = [...$menu.find(optionSelector)].find((option) =>
                option.textContent?.includes(preferredText)
            );

            if (preferredOption) {
                cy.wrap(preferredOption).click();
                return;
            }

            cy.get(menuSelector)
                .find(optionSelector)
                .its("length")
                .then((length) => {
                    const targetIndex = Math.min(fallbackIndex, Math.max(0, length - 1));
                    cy.get(menuSelector).find(optionSelector).eq(targetIndex).click();
                });
        });
};

const visitReviewPage = (agreementId) => {
    cy.intercept("GET", `**/agreements/${agreementId}**`).as("getAgreement");
    cy.visit(`/agreements/review/${agreementId}?mode=review`);
    cy.wait("@getAgreement", { timeout: 30000 });
    cy.url().should("include", `/agreements/review/${agreementId}`);
};

const selectAllActionableBudgetLinesForReview = () => {
    cy.get('[data-cy="check-all"]', { timeout: 20000 }).should("be.visible");
    cy.get('[data-cy="check-all"]').each(($el) => {
        cy.wrap($el).check({ force: true });
    });
    cy.get('input[name="budget-line-checkbox"]:checked').should("have.length.greaterThan", 1);
};

const openEditWizard = (agreementId) => {
    cy.visit(`/agreements/edit/${agreementId}?mode=edit`);
    cy.get("[data-cy='page-heading']").should("have.text", "Edit Agreement");
    cy.get("#continue").click();
};

const goToServicesStep = () => {
    cy.get("[data-cy='continue-btn']").should("not.be.disabled").click();
    cy.get("h2").first().should("have.text", "Create Services Components");
};

const goToBudgetLinesStep = () => {
    cy.get("#allServicesComponentSelect", { timeout: 20000 }).should("exist");
};

const fillRequiredAgreementDetails = () => {
    cy.get("#description").clear().type(agreementDetailsData.description);
    cy.get("#contract-type").select(agreementDetailsData.contract_type);
    cy.get("#service_requirement_type").select("Severable");
    selectFirstRealOption("#product_service_code_id");
    selectFirstRealOption("#procurement-shop-select");
    cy.get("#agreement_reason").select(agreementDetailsData.agreement_reason);
    selectComboboxOption(
        "#project-officer-combobox-input",
        ".project-officer-combobox__menu",
        ".project-officer-combobox__option",
        "Chris Fortunato",
        0
    );
    selectComboboxOption(
        "#team-member-combobox-input",
        ".team-member-combobox__menu",
        ".team-member-combobox__option",
        "System Owner",
        1
    );
    cy.get("#agreementNotes").clear().type(agreementDetailsData.notes);
};

const addServicesComponentViaUi = () => {
    cy.get("#servicesComponentSelect").select("1");
    cy.get("#pop-start-date").type("01/01/2024");
    cy.get("#pop-end-date").type("01/01/2025");
    cy.get("#description").type("This is a description.");
    cy.get("[data-cy='add-services-component-btn']").click();
    cy.get("[data-cy='alert']").should("contain", "successfully added");
    cy.contains("h2", /services component 1|base period 1/i).should("exist");
};

const addBudgetLineWithValidationTouches = () => {
    cy.get("#allServicesComponentSelect", { timeout: 20000 }).should("exist");
    cy.contains("Loading...").should("not.exist");
    cy.get("#can-combobox-input").should("not.be.disabled");

    cy.get("#can-combobox-input").type("G99HRF2{enter}");
    cy.get("#need-by-date").type("09/01/2048");
    cy.get("#enteredAmount").type("123");
    cy.get("#enteredDescription").type("test line description");

    cy.get("#add-budget-line").should("not.be.disabled").click();
    cy.get(".usa-alert__text").should(
        "contain",
        "Budget line TBD was updated. When you're done editing, click Create Agreement below."
    );
};

beforeEach(() => {
    createdAgreementIds.length = 0;
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
    deleteCreatedAgreements();
});

describe("create agreement and test validations", () => {
    it("advances to services step after agreement details are completed", () => {
        createAgreement().then((agreementId) => {
            openEditWizard(agreementId);

            fillRequiredAgreementDetails();
            cy.get("[data-cy='continue-btn']").should("not.be.disabled").click();
            cy.get("h2").first().should("have.text", "Create Services Components");
        });
    });

    it("creates a services component after details are valid", () => {
        createValidAgreement().then((agreementId) => {
            openEditWizard(agreementId);
            cy.get("#project-combobox-input").should("not.exist");
            cy.get(".usa-form-group--error").should("not.exist");

            goToServicesStep();

            cy.get("p").should("contain", "You have not added any Services Component yet.");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("p").should("contain", "You have not added any Services Component yet.");

            cy.get("#servicesComponentSelect").select("1");
            cy.get("#servicesComponentSelect").select("");
            cy.get("[data-cy='add-services-component-btn']").click();
            cy.get("p").should("contain", "You have not added any Services Component yet.");

            addServicesComponentViaUi();
            cy.get("[data-cy='continue-btn']").should("not.be.disabled");
        });
    });

    it("validates and saves a budget line", () => {
        createValidAgreement().then((agreementId) => {
            createServicesComponent(agreementId).then(() => {
                openEditWizard(agreementId);
                goToServicesStep();
                goToBudgetLinesStep();

                addBudgetLineWithValidationTouches();

                cy.get('[data-cy="continue-btn"]').should("not.be.disabled").click();

                visitReviewPage(agreementId);
                cy.get('[data-cy="error-list"]').should("not.exist");
            });
        });
    });

    it("enables review status transitions when valid data exists", () => {
        createValidAgreement().then((agreementId) => {
            createServicesComponent(agreementId).then((servicesComponentId) => {
                createBudgetLineItem(agreementId, servicesComponentId).then(() => {
                    cy.visit(`/agreements/${agreementId}/budget-lines`);
                    cy.get('[data-cy="bli-continue-btn"]').should("not.be.disabled").click();

                    cy.get('[type="radio"]', { timeout: 60000 }).should("have.length.greaterThan", 0);
                    cy.get('[data-cy="send-to-approval-btn"]').should("be.disabled");

                    selectEnabledStatusRadio();
                    cy.get('[type="radio"]:checked', { timeout: 60000 }).should("exist");
                    selectAllActionableBudgetLinesForReview();

                    cy.get('[data-cy="send-to-approval-btn"]', { timeout: 20000 }).should("not.be.disabled");
                });
            });
        });
    });

    it("repairs an incomplete budget line after review disables submission", () => {
        createValidAgreement().then((agreementId) => {
            createServicesComponent(agreementId).then((servicesComponentId) => {
                createBudgetLineItem(agreementId, servicesComponentId).then(() => {
                    openEditWizard(agreementId);
                    goToServicesStep();
                    goToBudgetLinesStep();

                    selectFirstRealOption("#allServicesComponentSelect");
                    cy.get("#add-budget-line").should("not.be.disabled").click();
                    cy.get(".usa-alert__text").should(
                        "contain",
                        "Budget line TBD was updated. When you're done editing, click Create Agreement below."
                    );

                    cy.get('[data-cy="continue-btn"]').should("not.be.disabled").click();

                    visitReviewPage(agreementId);
                    cy.get('[data-cy="send-to-approval-btn"]').should("be.disabled");

                    cy.get('[data-cy="edit-agreement-btn"]').click();
                    cy.get("#continue").click();
                    cy.get('[data-cy="continue-btn"]').should("not.be.disabled").click();
                    cy.get(".usa-form-group--error").should("exist");
                    cy.get("tbody").children().as("table-rows").should("have.length", 2);
                    cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
                    cy.get("[data-cy='edit-row']").click();
                    cy.get(".usa-form-group--error").should("have.length", 4);
                    cy.get('[data-cy="update-budget-line"]').should("be.disabled");

                    cy.contains("Loading...").should("not.exist");
                    cy.get("#can-combobox-input").should("not.be.disabled");
                    cy.get("#can-combobox-input").clear().type("G994426{enter}");
                    cy.get(".can-combobox__single-value").should("contain", "G994426");
                    selectFirstRealOption("#allServicesComponentSelect");
                    cy.get("#need-by-date").clear().type("09/01/2048");
                    cy.get("#enteredAmount").clear().type("111111");
                    cy.get("#enteredDescription").clear().type("test line description");
                    cy.get('[data-cy="update-budget-line"]').should("not.be.disabled").click();
                    cy.get(".usa-alert__text").should("contain", "was updated");
                    cy.get("#budget-line-form").find(".usa-form-group--error").should("not.exist");
                    cy.get("#budget-line-form").should("not.contain", "Update Budget Line");

                    cy.get('[data-cy="continue-btn"]').should("not.be.disabled").click();

                    visitReviewPage(agreementId);
                    cy.get("h1", { timeout: 20000 })
                        .should("be.visible")
                        .and("not.have.text", "Please resolve the errors outlined below");
                    cy.get('[data-cy="error-list"]').should("not.exist");
                });
            });
        });
    });
});
