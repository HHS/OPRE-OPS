import { defineConfig } from "cypress";

export default defineConfig({
    e2e: {
        baseUrl: "http://localhost:3000",
        specPattern: [
            "cypress/e2e/reviewAgreement.cy.js", // <-- there is another test that must affect the BLI calculations here
            "cypress/e2e/budgetLineItemsList.cy.js", // <-- there is another test that must affect the BLI calculations here
            "cypress/e2e/agreementDelete.cy.js",
            "cypress/e2e/agreementDetails.cy.js",
            "cypress/e2e/agreementDetailsEdit.cy.js",
            "cypress/e2e/agreementList.cy.js",
            "cypress/e2e/agreementsPagination.cy.js",
            "cypress/e2e/agreementsPaginationFilters.cy.js",
            "cypress/e2e/agreementsPaginationSorting.cy.js",
            "cypress/e2e/agreementsPaginationExport.cy.js",
            "cypress/e2e/agreementsPaginationAccessibility.cy.js",
            "cypress/e2e/approveChangeRequestsAtAgreementLevel.cy.js",
            "cypress/e2e/approveCrossDivisionCRs.cy.js",
            "cypress/e2e/auth.cy.js",
            "cypress/e2e/budgetChangeRequest.cy.js",
            "cypress/e2e/canDetail.cy.js",
            "cypress/e2e/canList.cy.js",
            "cypress/e2e/components.cy.js",
            "cypress/e2e/createAgreement.cy.js",
            "cypress/e2e/createAgreementWithValidations.cy.js",
            "cypress/e2e/createAAAgreement.cy.js",
            "cypress/e2e/createBLIForAgreement.cy.js",
            "cypress/e2e/createResearchProject.cy.js",
            "cypress/e2e/declineChangeRequestsAtAgreementLevel.cy.js",
            "cypress/e2e/editAgreement.cy.js",
            "cypress/e2e/editAgreementAsBasicUser.cy.js",
            "cypress/e2e/loginPage.cy.js",
            "cypress/e2e/mainPage.cy.js",
            "cypress/e2e/notificationCenter.cy.js",
            "cypress/e2e/portfolioDetail.cy.js",
            "cypress/e2e/portfolioList.cy.js",
            "cypress/e2e/procurementShopChangeRequest.cy.js",
            "cypress/e2e/researchProjectDetail.cy.js",
            "cypress/e2e/reviewChangeRequestResponse.cy.js",
            "cypress/e2e/reviewChangeRequestsAtCardLevel.cy.js",
            "cypress/e2e/statusChangeRequest.cy.js",
            "cypress/e2e/uploadDocument.cy.js",
            "cypress/e2e/helpCenter.cy.js",
            "cypress/e2e/editBudgetLineByPowerUser.cy.js",
            "cypress/e2e/saveChangesToEdits.cy.js",
            "cypress/e2e/procurementTracker.cy.js"



        ],
        // Adding custom task logging, for better a11y output
        // ref: https://docs.cypress.io/api/commands/task#Usage
        // https://github.com/component-driven/cypress-axe#using-the-violationcallback-argument
        setupNodeEvents(on, config) {
            on("task", {
                log(message) {
                    console.log(message);
                    return null;
                },
                table(message) {
                    console.table(message);

                    return null;
                }
            });
        },
        defaultCommandTimeout: 20000,
        requestTimeout: 20000,
        responseTimeout: 60000,
        pageLoadTimeout: 120000,
        taskTimeout: 180000,
        numTestsKeptInMemory: 1,
        experimentalMemoryManagement: true,
        video: false,
        screenshotOnRunFailure: true
    },
    video: false,
    viewportHeight: 768,
    viewportWidth: 1024,
    retries: {
        // Configure retry attempts for `cypress run`
        // Default is 0
        runMode: 3,
        // Configure retry attempts for `cypress open`
        // Default is 0
        openMode: 0
    }
});
