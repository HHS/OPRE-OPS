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
            // Register for cleanup before any assertion can throw.
            const agreementId = response.body.id;
            createdAgreementIds.push(agreementId);
            expect(response.status).to.eq(201);

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
            // Register for cleanup before any assertion can throw.
            const agreementId = response.body.id;
            createdAgreementIds.push(agreementId);
            expect(response.status).to.eq(201);

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

    it("shows a no-match message in the dropdown and on the results page", () => {
        const noMatch = `E2E-NO-MATCH-${Date.now()}`;
        cy.visit("/");
        cy.get('[data-cy="header-search-input"]').type(noMatch);

        cy.get('[data-cy="header-search-no-results"]', { timeout: 10000 }).should("contain.text", noMatch);
        cy.get('[data-cy="header-search-option"]').should("not.exist");
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);

        cy.get('[data-cy="header-search-input"]').type("{enter}");
        cy.url({ timeout: 10000 }).should("include", "/search?q=");
        cy.get('[data-cy="search-results-empty"]', { timeout: 10000 }).should("contain.text", noMatch);
        cy.checkA11y(null, null, terminalLog);
    });

    it("lists several matches and opens the highlighted one with the keyboard", () => {
        const prefix = `E2E Header Search Multi ${Date.now()}`;
        cy.wrap(["A", "B"]).each((suffix) => {
            addAgreement({
                ...testAgreement,
                name: `${prefix} ${suffix}`,
                po_number: `E2E-HS-${suffix}-${Date.now()}`
            }).then((response) => {
                createdAgreementIds.push(response.body.id);
                expect(response.status).to.eq(201);
            });
        });

        cy.visit("/");
        cy.get('[data-cy="header-search-input"]').type(prefix);
        cy.get('[data-cy="header-search-option"]', { timeout: 10000 }).should("have.length", 2);
        cy.get('[data-cy="header-search-footer"]').should("contain.text", "2 results");
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);

        // Options are ordered by name, so the first row is "... A".
        cy.get('[data-cy="header-search-input"]').type("{downArrow}{enter}");
        cy.url({ timeout: 10000 }).should("match", /\/agreements\/\d+/);
        cy.get('[data-cy="header-search-input"]').should("have.value", "");
    });

    it("shows an error message in the dropdown when the search request fails", () => {
        cy.intercept("GET", "**/api/v1/agreements-search/**", { statusCode: 500, body: { error: "boom" } });
        cy.visit("/");
        cy.get('[data-cy="header-search-input"]').type("anything");

        cy.get('[data-cy="header-search-error"]', { timeout: 10000 }).should("contain.text", "Search is unavailable");
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("explains what can be searched from the info icon", () => {
        cy.visit("/");
        cy.get('[data-cy="header-search-info-tip"]').should("not.be.visible");
        cy.get('[data-cy="header-search-info"]').focus();
        cy.get('[data-cy="header-search-info-tip"]')
            .should("be.visible")
            .and("contain.text", "You can search agreements by:")
            .and("contain.text", "Purchase order (PO) #")
            .and("contain.text", "Agreement title or nickname");
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });
});
