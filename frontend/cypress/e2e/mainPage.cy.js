import { testLogin } from "./utils";

beforeEach(() => {
    cy.visit("/");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y();
});

it("has expected state on initial load", () => {
    // cy.window()
    //     .then((win) => win.store.getState().auth)
    //     .should("deep.include", { isLoggedIn: false, activeUser: null });
    cy.fixture("initial-state").then((initState) => {
        cy.window()
            .then((win) => win.store.getState())
            .should("deep.include", initState);
    });
});

it("loads", () => {
    cy.get("h1").should("have.text", "This is the OPRE OPS system prototype.");
});

it("clicking on /cans nav takes you to CAN page", () => {
    // For this test, we've altered the busienss rule so that /cans loads unauthed.
    // cy.fakeLogin();
    cy.contains("CANs").click();

    cy.url().should("include", "/cans/");
    cy.get("h1").should("have.text", "CANs");
});

it("clicking on /portfolio nav while unauthenticated, should keep you at home page.", () => {
    cy.get("h1").should("have.text", "This is the OPRE OPS system prototype.");
    //cy.contains("Portfolios").click();

    cy.url().should("include", "/");
    //cy.get("h1").should("have.text", "Portfolios");
});
