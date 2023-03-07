before(() => {
    cy.visit("/");
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.visit("/cans");
    cy.injectAxe();
});

it("loads", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.get("h1").should("have.text", "CANs");
    cy.get('a[href="/cans/3"]').should("exist");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});

it("clicking on a CAN takes you to the detail page", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    const canNumber = "G99PHS9";

    cy.contains(canNumber).click();

    cy.url().should("include", "/cans/3");
    cy.get("h1").should("contain", canNumber);
});
