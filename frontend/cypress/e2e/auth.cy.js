beforeEach(() => {
    cy.visit("/");
    cy.injectAxe();
});

it("access_token is present within localstorage", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.window().then((win) => cy.setIsLoggedIn(win));
    cy.visit("/");
    cy.getLocalStorage("access_token").should("exist");
});

it("sign in button visible at page load when there is no jwt", () => {
    // cannot click on/test sign in button because of cross origin security
    cy.visit("/");
    cy.contains("Sign-in");
});

it("sign out button visible when there is a jwt", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.contains("Sign-out");
});

it.skip("********* DEBUGGING clicking logout removes the jwt and displays sign-in", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.contains("Sign-out").click();
    cy.window().its("localStorage").invoke("getItem", "access_token").should("not.exist");
    cy.window()
        .then((win) => win.store.getState().auth)
        .should("deep.include", { isLoggedIn: false });
    cy.contains("Sign-in");
    cy.url("/");
});

it("isLoggedIn is false when there is no jwt", () => {
    cy.visit("/");
    cy.window()
        .then((win) => win.store.getState().auth)
        .should("deep.include", { isLoggedIn: false });
});

it("******isLoggedIn is true when there is a jwt", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.window()
        .then((win) => win.store.getState().auth)
        .should("deep.include", { isLoggedIn: true });
});

it("sign out button visible when there is a jwt", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.visit("/");
    cy.contains("Sign-out");
});

it("passes a11y checks", () => {
    cy.visit("/");
    cy.injectAxe();
    cy.checkA11y();
});
