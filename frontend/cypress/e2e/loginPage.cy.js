/// <reference types="cypress" />
import { testLogin } from "./utils";

it("has expected state on initial load", () => {
    cy.visit("/login");
    cy.fixture("initial-state").then((initState) => {
        cy.window()
            .then((win) => win.store.getState())
            .should("deep.include", initState);
    });
});

it("FakeAuth can login with Admin user", () => {
    testLogin("admin");
    cy.contains("Sign-out").click();
    cy.url().should("include", "/login");
});

it("FakeAuth can login with Basic user", () => {
    testLogin("basic");
    cy.contains("Sign-out").click();
    cy.url().should("include", "/login");
});
