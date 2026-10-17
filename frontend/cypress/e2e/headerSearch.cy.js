/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

const addAgreement = (agreement) => {
    expect(localStorage.getItem("access_token")).to.exist;
    const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
    return cy.request({
        method: "POST",
        url: "http://localhost:8080/api/v1/agreements/",
        body: agreement,
        headers: {
            Authorization: bearer_token,
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    });
};

const deleteAgreement = (agreementId) => {
    const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
    cy.request({
        method: "DELETE",
        url: `http://localhost:8080/api/v1/agreements/${agreementId}`,
        headers: {
            Authorization: bearer_token,
            Accept: "application/json"
        }
    });
};

describe("Header agreement search", () => {
    let createdAgreementIds;
    let testAgreement;

    beforeEach(() => {
        // a unique identifier avoids conflicts across test runs
        const uniqueId = Date.now();
        testAgreement = {
            agreement_type: "CONTRACT",
            name: `E2E Header Search Agreement ${uniqueId}`,
            service_requirement_type: "SEVERABLE",
            po_number: `E2E-HS-${uniqueId}`,
            project_id: 1000
        };
        createdAgreementIds = [];

        testLogin("system-owner");
    });

    afterEach(() => {
        // Clean up unconditionally, including when the test throws, so a failing assertion never
        // leaves orphaned test agreements in the shared e2e DB.
        createdAgreementIds.forEach((id) => deleteAgreement(id));
    });

    it("opens an agreement straight from a type-ahead suggestion", () => {
        addAgreement(testAgreement).then((response) => {
            expect(response.status).to.eq(201);
            const agreementId = response.body.id;
            createdAgreementIds.push(agreementId);

            cy.visit("/");
            cy.get('[data-cy="header-search-input"]').type(testAgreement.po_number);

            cy.get('[data-cy="header-search-option"]', { timeout: 10000 })
                .should("have.length", 1)
                .and("contain.text", testAgreement.name)
                .and("contain.text", testAgreement.po_number);
            cy.get('[data-cy="header-search-footer"]').should("contain.text", "1 result");

            // The header is on every page, so check it with the dropdown open.
            cy.injectAxe();
            cy.checkA11y(null, null, terminalLog);

            cy.get('[data-cy="header-search-option"]').click();
            cy.url({ timeout: 10000 }).should("include", `/agreements/${agreementId}`);
        });
    });

    it("shows full results on Enter and links to the agreement", () => {
        addAgreement(testAgreement).then((response) => {
            expect(response.status).to.eq(201);
            const agreementId = response.body.id;
            createdAgreementIds.push(agreementId);

            cy.visit("/");
            cy.get('[data-cy="header-search-input"]').type(`${testAgreement.po_number}{enter}`);

            cy.url({ timeout: 10000 }).should("include", "/search?q=");
            cy.get('[data-cy="search-result-row"]', { timeout: 10000 })
                .should("have.length", 1)
                .and("contain.text", testAgreement.name)
                .and("contain.text", `ODN: ${testAgreement.po_number}`);
            cy.injectAxe();
            cy.checkA11y(null, null, terminalLog);

            // The query lives in the URL, so a reload reproduces the results and the search box.
            cy.reload();
            cy.get('[data-cy="header-search-input"]').should("have.value", testAgreement.po_number);
            cy.get('[data-cy="search-result-row"]', { timeout: 10000 }).should("have.length", 1);

            cy.contains("a", testAgreement.name).click();
            cy.url({ timeout: 10000 }).should("include", `/agreements/${agreementId}`);
        });
    });
});
