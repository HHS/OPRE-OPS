/// <reference types="cypress" />
import { testLogin } from "./utils";

beforeEach(() => {
    cy.visit("/");
});

it("redirect to /login when ther is no jwt", () => {
    cy.session("anonymous", () => {
        cy.visit("/");
        cy.url().should("include", "/login");
    });
});

it.skip("***** WIP ***** FakeAuth: Admin user can login", () => {
    cy.session("FakeAuth-Admin", () => {
        cy.visit("/login");
        cy.contains("Sign in with FakeAuth").click();
        cy.contains("Admin User").click();
        cy.url().should("include", "/");
        cy.getLocalStorage("access_token").should("exist");
        cy.window()
            .then((win) => win.store.getState().auth)
            .should("deep.include", { isLoggedIn: false });
    });
});

it("access_token is present within localstorage after login", () => {
    testLogin("admin");
    cy.getLocalStorage("access_token").should("exist");
});

it("clicking logout removes the jwt and displays redirects to /login", () => {
    cy.visit("/");
    testLogin("admin");
    cy.contains("Sign-out").click();
    cy.window().its("localStorage").invoke("getItem", "access_token").should("not.exist");
    cy.window()
        .then((win) => win.store.getState().auth)
        .should("deep.include", { isLoggedIn: false });
    cy.url().should("include", "/login");
});

it("isLoggedIn state is false when there is no jwt", () => {
    cy.visit("/");
    cy.window()
        .then((win) => win.store.getState().auth)
        .should("deep.include", { isLoggedIn: false });
});

it("isLoggedIn state is true when there is a jwt", () => {
    cy.visit("/");
    testLogin("admin");
    cy.window()
        .then((win) => win.store.getState().auth)
        .should("deep.include", { isLoggedIn: true });
});

it("Sign Out button visible when user is Authenticated", () => {
    cy.visit("/");
    testLogin("admin");
    cy.contains("Sign-out");
});
