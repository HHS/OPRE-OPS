import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/agreements/create");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.get("h2").should("contain", "Select a Project");
});

it("project type select has some projects", () => {
    cy.get("#project--list").children().should("contain", "Human Services Interoperability Support");
    cy.get("#project--list").children().should("contain", "Youth Demonstration Development Project");
    cy.get("#project--list").children().should("contain", "Annual Performance Plans and Reports");
});

it("can create an agreement", () => {
    cy.intercept("POST", "**/agreements").as("postAgreement");

    // Step One - Select a Project
    cy.get("#project--list--toggle").click();
    cy.get("#project--list").invoke("show");
    cy.get("li").contains("Human Services Interoperability Support").click();
    cy.get("#continue").click();

    // Step Two - Create an Agreement
    cy.get("#agreement-type-options").select("CONTRACT");
    cy.get("#agreement-title").type("Test Agreement Title");
    cy.get("#agreement-description").type("Test Agreement Description");
    cy.get("#product-service-code-options").select("Other Scientific and Technical Consulting Services");
    cy.get("#procurement-shop-select").select("Product Service Center (PSC)");
    cy.get("#procurement-shop-select").select("Product Service Center (PSC)");
    cy.get("#reason-for-agreement-select").select("NEW_REQ");

    // Select Project Officer
    cy.get("#project-officer-select-toggle-list").click();
    cy.get("#project-officer-select").invoke("show");
    cy.get("#users--list").invoke("show");
    cy.get("li").contains("Chris Fortunato").click();

    // Skip Select Team Members for now - something is wrong with the select
    cy.get("#with-hint-textarea").type("This is a note.");
    cy.get("#continue").click();

    cy.wait("@postAgreement")
        .then((interception) => {
            const { statusCode, body } = interception.response;
            expect(statusCode).to.equal(201);
            expect(body.message).to.equal("Agreement created");
        })
        .then(cy.log);
});
