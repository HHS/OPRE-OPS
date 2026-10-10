/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

let testAgreement = {
    agreement_type: "CONTRACT",
    name: "E2E ODN Lookup Agreement",
    service_requirement_type: "SEVERABLE",
    po_number: "E2E-ODN-LOOKUP"
};

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

describe("Agreements List - Find by ODN", () => {
    beforeEach(() => {
        // append a unique identifier to avoid conflicts across test runs
        const uniqueId = Date.now();
        testAgreement.name = `E2E ODN Lookup Agreement ${uniqueId}`;
        testAgreement.po_number = `E2E-ODN-${uniqueId}`;

        testLogin("system-owner");
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("navigates to the matching agreement for a known ODN (golden path)", () => {
        addAgreement(testAgreement).then((response) => {
            expect(response.status).to.eq(201);
            const agreementId = response.body.id;

            cy.visit("/agreements");
            cy.get("#fiscal-year-select").select("All");

            cy.get("#agreement-odn-lookup-input").type(testAgreement.po_number);
            cy.get('[data-cy="agreement-odn-lookup-submit"]').click();

            cy.url({ timeout: 10000 }).should("include", `/agreements/${agreementId}`);

            deleteAgreement(agreementId);
        });
    });

    it("shows a clear no-match message for an unknown ODN (negative path)", () => {
        cy.visit("/agreements");
        cy.get("#fiscal-year-select").select("All");

        cy.get("#agreement-odn-lookup-input").type("ODN-DOES-NOT-EXIST-E2E");
        cy.get('[data-cy="agreement-odn-lookup-submit"]').click();

        cy.get('[data-cy="agreement-odn-lookup-no-match"]', { timeout: 10000 })
            .should("be.visible")
            .and("contain.text", "No agreements found with ODN");

        cy.url().should("include", "/agreements");
        cy.url().should("not.match", /\/agreements\/\d+/);
    });
});
