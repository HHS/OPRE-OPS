import { login } from "../../src/components/Auth/authSlice";

export const testLogin = (name, win) => {
    cy.visit("/");
    cy.fakeLogin(name);
    cy.visit("/"); // This is mostly to "touch" the page, and ensure the window is active.
    cy.window().its("store").should("exist");
    cy.window().its("store").invoke("dispatch", login());
};
