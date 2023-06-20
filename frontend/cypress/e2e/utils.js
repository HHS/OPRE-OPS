import { login } from "../../src/components/Auth/authSlice";

// Define at the top of the spec file or just import it
export const terminalLog = (violations) => {
    cy.task(
        "log",
        `${violations.length} accessibility violation${violations.length === 1 ? "" : "s"} ${
            violations.length === 1 ? "was" : "were"
        } detected`
    );
    // pluck specific keys to keep the table readable
    const violationData = violations.map(({ id, impact, description, nodes }) => ({
        id,
        impact,
        description,
        nodes: nodes.length,
    }));

    cy.task("table", violationData);
};

export const testLogin = (name, win) => {
    cy.visit("/");
    cy.fakeLogin(name);
    cy.visit("/"); // This is mostly to "touch" the page, and ensure the window is active.
    cy.window().its("store").should("exist");
    cy.window().its("store").invoke("dispatch", login());
};
