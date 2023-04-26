import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/agreements");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.get("h1").should("have.text", "Agreements");
});
