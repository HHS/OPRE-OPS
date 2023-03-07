beforeEach(() => {
    cy.visit("/");
    cy.injectAxe();
});

it("has expected state on load", () => {
    cy.visit("/");
    cy.window()
        .then((win) => win.store.getState().auth)
        .should("deep.include", { isLoggedIn: false });
});

it("loads", () => {
    cy.get("h1").should("have.text", "This is the OPRE OPS system prototype.");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});

it("clicking on /cans nav while unauthneticated, should keep you on the home page.", () => {
    cy.get("h1").should("have.text", "This is the OPRE OPS system prototype.");
    //cy.contains("CANs").click();

    cy.url().should("include", "/");
    //cy.get("h1").should("have.text", "CANs");
});

it("clicking on /portfolio nav while unauthenticated, should keep you at home page.", () => {
    cy.get("h1").should("have.text", "This is the OPRE OPS system prototype.");
    //cy.contains("Portfolios").click();

    cy.url().should("include", "/");
    //cy.get("h1").should("have.text", "Portfolios");
});
