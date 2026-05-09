/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";
import { getCurrentFiscalYear } from "../../src/helpers/utils.js";

const PROJECT_ID = 1000;
const currentFY = getCurrentFiscalYear();
const twoDigitFY = String(currentFY).slice(-2);

beforeEach(() => {
    testLogin("system-owner");
    cy.visit(`/projects/${PROJECT_ID}/funding`);
    cy.get("h1", { timeout: 10000 }).should("be.visible");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

describe("Project Funding Tab", () => {
    it("renders the project title and Project Funding tab as selected", () => {
        cy.get("h1").should("contain", "Human Services Interoperability Support");
        cy.get("[data-cy='project-tab-Project Funding']")
            .should("be.visible")
            .and("not.be.disabled");
    });

    it("shows the FY selector defaulting to the current fiscal year", () => {
        cy.get("#fiscal-year-select")
            .should("be.visible")
            .and("have.value", String(currentFY));
    });

    it("renders the Project Funding Summary section heading and all three cards", () => {
        cy.contains("h2", "Project Funding Summary").should("be.visible");
        cy.get("[data-cy='project-funding-by-portfolio-card']").should("be.visible");
        cy.contains(`FY ${currentFY} Project Funding by Portfolio`).should("be.visible");
        cy.contains(`FY ${currentFY} Project Funding by CAN`).should("be.visible");
        cy.contains("Project Funding By FY").should("be.visible");
    });

    it("renders the Project Funding by CAN table with rows and linked CAN numbers", () => {
        cy.contains("h2", "Project Funding by CAN").should("be.visible");
        cy.contains(`FY ${twoDigitFY} Project Funding`).should("be.visible");
        cy.contains("Lifetime Project Funding").should("be.visible");

        // At least one CAN row should be present for project 1000
        cy.get("table tbody tr").should("have.length.greaterThan", 0);

        // CAN numbers should be links to /cans/:id
        cy.get("table tbody tr")
            .first()
            .find("a")
            .should("have.attr", "href")
            .and("match", /^\/cans\/\d+$/);
    });

    it("updates the FY funding column header when the FY selector changes", () => {
        const previousFY = currentFY - 1;
        const previousTwoDigit = String(previousFY).slice(-2);

        cy.get("#fiscal-year-select").select(String(previousFY));

        cy.contains(`FY ${previousTwoDigit} Project Funding`).should("be.visible");
        cy.contains(`FY ${previousFY} Project Funding by Portfolio`).should("be.visible");
        cy.contains(`FY ${previousFY} Project Funding by CAN`).should("be.visible");
    });
});
