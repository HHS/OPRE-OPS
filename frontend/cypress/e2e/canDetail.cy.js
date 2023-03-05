before(() => {
    cy.visit("/");
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.visit("/cans/3/");
    cy.injectAxe();
});

it("loads", () => {
    cy.window().then((win) => {
        cy.fakeLogin();
        cy.setIsLoggedIn(win);
    });
    cy.visit("/cans/3/");
    cy.get("h1").should("contain", "G99PHS9");
});

it("passes a11y checks", () => {
    cy.injectAxe();
    cy.checkA11y();
});

it.skip("get can fiscal year details - skip while the UI is being updated and data changes", () => {
    cy.fakeLogin();
    clickOnFiscalYearOption(2);
    cy.contains("7512000");
    cy.checkA11y();
});

it.skip("get a negative value - skip for now because we are working on requirements for how to calculate total/pending/funded/etc", () => {
    cy.fakeLogin();
    clickOnFiscalYearOption(3);
    cy.contains("-300000");
    cy.get("[class*='redNegative']").contains("-300000");
    cy.checkA11y();
});

const clickOnFiscalYearOption = (optionIndex) => {
    cy.fakeLogin();
    cy.get("[class*='-control']").click(0, 0, { force: true });

    cy.get("[class*='-menu']"); //ensure the dropdown menu is visible so the check a11y checks the visible menu
    cy.checkA11y();

    cy.get("[class*='-menu']").find("[id*='-option']").eq(optionIndex).click(0, 0, { force: true });
};
