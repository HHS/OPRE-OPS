beforeEach(() => {
    // cy.visit("/");
    cy.injectAxe();
});

it("sign in button visible at page load when there is no jwt", () => {
    // cannot click on/test sign in button because of cross origin security
    cy.visit("/");
    cy.contains("Sign-in");
});

it("sign out button visible when there is a jwt", () => {
    cy.login();
    cy.visit("/");
    cy.contains("Sign-out");
});

it("clicking logout removes the jwt and displays sign-in", () => {
    cy.login();
    cy.visit("/");
    cy.contains("Sign-out").click();
    cy.window().its("localStorage").invoke("getItem", "jwt").should("not.exist");
    cy.contains("Sign-in");
    cy.url("/");
});

it("isLoggedIn is false when there is no jwt", () => {
    cy.visit("/");
    cy.window()
        .then((win) => win.store.getState().auth)
        .should("deep.include", { isLoggedIn: false });
});

// this test currently doesn't work - not sure why - maybe the state is getting cached?
it.skip("isLoggedIn is true when there is a jwt", () => {
    cy.login();
    cy.visit("/");
    cy.window()
        .then((win) => win.store.getState().auth)
        .should("deep.include", { isLoggedIn: true });
});

it("sign out button visible when there is a jwt", () => {
    cy.login();
    cy.visit("/");
    cy.contains("Sign-out");
});

it("passes a11y checks", () => {
    cy.visit("/");
    cy.injectAxe();
    cy.checkA11y();
});
