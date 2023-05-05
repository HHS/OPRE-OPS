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

    // select item in combobox
    // cy.get("#project--list").select("Human Services Interoperability Support");
    cy.get("#project--list--toggle").click();
    cy.get("li").contains("Human Services Interoperability Support").click();
    // get li containing text "Human Services Interoperability Support" and click it

    // cy.get("#project-type-select-options").select("Research");
    // cy.get("#project-abbr").type("Test Project Abbreviation");
    // cy.get("#project-name").type("Test Project Name");
    // cy.get("#project-description").type("Test Project Description");
    cy.get("#continue").click();

    // cy.wait("@postProject")
    //     .then((interception) => {
    //         const { statusCode, body } = interception.response;
    //         expect(statusCode).to.equal(201);
    //         expect(body.title).to.equal("Test Project Name");
    //         expect(body.short_title).to.equal("Test Project Abbreviation");
    //         expect(body.description).to.equal("Test Project Description");
    //     })
    //     .then(cy.log);
    // cy.get(".usa-alert__body").should("contain", "The project has been successfully created.");
});
//
// it("can cancel a project", () => {
//     cy.get("#project-type-select-options").select("Research");
//     cy.get("#project-abbr").type("Test Project Abbreviation");
//     cy.get("#project-name").type("Test Project Name");
//     cy.get("#project-description").type("Test Project Description");
//     cy.get("#cancel").click();
//     cy.get(".usa-modal").should("contain", "Are you sure you want to cancel?");
// });
