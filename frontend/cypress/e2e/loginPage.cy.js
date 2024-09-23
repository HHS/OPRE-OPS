/// <reference types="cypress" />
import { testLogin } from "./utils";

it("has expected state on initial load", () => {
    cy.visit("/login");
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
