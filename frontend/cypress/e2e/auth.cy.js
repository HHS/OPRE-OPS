beforeEach(() => {
    cy.visit("/");
    cy.injectAxe();
});

it("sign in button visible at page load when there is no jwt", () => {
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
    cy.contains("Sign-out")
        .click()
        .should(() => {
            // eslint-disable-next-line no-unused-expressions
            expect(localStorage.getItem("jwt")).to.null;
        });
    cy.contains("Sign-in");
});

it("passes a11y checks", () => {
    cy.checkA11y();
});
