/// <reference types="cypress" />
import { testLogin } from "./utils";

it("has expected state on initial load", () => {
    cy.visit("/login");
});

it("FakeAuth can login with System Owner user", () => {
    testLogin("system-owner");
    cy.contains("Sign-out").click();
    cy.url().should("include", "/login");
});

it("FakeAuth can login with User Demo", () => {
    testLogin("basic");
    cy.contains("Sign-out").click();
    cy.url().should("include", "/login");
});
