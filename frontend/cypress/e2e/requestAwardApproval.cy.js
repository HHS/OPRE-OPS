/// <reference types="cypress" />

import { testLogin } from "./utils";

const AGREEMENT_ID = 13; // Agreement with completed Step 5

describe("Request Award Approval Page", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit(`/agreements/${AGREEMENT_ID}/award-approval`);
    });

    it("displays award approval request form", () => {
        cy.contains("h1", "Request Award Approval").should("be.visible");
    });

    it("displays notes textarea", () => {
        cy.contains("label", "Notes").should("be.visible");
        cy.get("textarea[name='notes']").should("be.visible");
        cy.contains("Maximum 150 characters").should("be.visible");
    });

    it("allows user to type notes", () => {
        const testNote = "This is a test note for award approval.";
        cy.get("textarea[name='notes']").type(testNote);
        cy.get("textarea[name='notes']").should("have.value", testNote);
    });

    it("has cancel button", () => {
        cy.contains("button", "Cancel").should("be.visible").and("not.be.disabled");
    });

    it("has request award approval button", () => {
        cy.contains("button", "Request Award Approval").should("be.visible");
    });
});
