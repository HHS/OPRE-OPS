/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

before(() => {
    testLogin("admin");
    cy.visit("/budget-lines/create");
});

// afterEach(() => {
//     cy.injectAxe();
//     cy.checkA11y(null, null, terminalLog);
// });

const blData = [
    {
        descr: "SC1",
        can: "G99HRF2",
        month: "09 - Sep",
        day: "01",
        year: "2023",
        amount: "111111",
        note: "note one",
    },
    {
        descr: "SC2",
        can: "G99HRF2",
        month: "09 - Sep",
        day: "22",
        year: "2023",
        amount: "222222",
        note: "note two",
    },
];

const completeStepOne = () => {
    // cy.visit("/budget-lines/create");
    // step one should say "Project & Agreement"
    cy.get(".usa-step-indicator__segment--current").should("contain", "Project & Agreement");
    // summary cards should not exist
    cy.get('[data-cy="project-summary-card"]').should("not.exist");
    cy.get('[data-cy="agreement-summary-card"]').should("not.exist");
    // continue button should be disabled
    cy.get('[data-cy="continue-button-step-one"]').should("be.disabled");
    // agreement should be disabled until project is selected
    cy.get("#agreement").should("be.disabled");
    // select project
    cy.get("#project").type("Human Services Interoperability Support{enter}");
    // summary card should exist after project is selected
    cy.get('[data-cy="project-summary-card"]').should("exist");
    // agreement should be enabled after project is selected
    cy.get("#agreement").should("not.be.disabled");
    cy.get("#agreement").select(1);
    cy.get('[data-cy="agreement-summary-card"]').should("exist");
    cy.get('[data-cy="continue-button-step-one"]').as("continue-btn").should("not.disabled");
    cy.get("@continue-btn").click();
};

const completeStepTwo = () => {
    cy.get(".usa-step-indicator__segment--current").should("contain", "Budget Lines");
    cy.get('[data-cy="project-agreement-summary-box"]').as("pasb").should("exist");
    cy.get("@pasb")
        .should("contain", "Human Services Interoperability Support")
        .and("contain", "Contract #1: African American Child and Family Research Center")
        .and("contain", "Product Service Center")
        .and("contain", "0");
    // cy.get('[data-cy="total-summary-card-total"]').should("contain", "$0.00");
    cy.get('[data-cy="total-summary-cards"]').as("tsc").should("exist");
    cy.get("@tsc").should("contain", "Draft Total").and("contain", "$0.00");
};

const createBudgetLine = (bl) => {
    cy.get("#bl-description").type(bl.descr);
    cy.get("#can-select").type(`${bl.can}{enter}`);
    cy.get("#procurement_month").select(bl.month);
    cy.get("#procurement_day").type(bl.day);
    cy.get("#procurement_year").type(bl.year);
    cy.get("#bl-amount").type(bl.amount);
    cy.get("#with-hint-textarea").type(bl.note);
    cy.get("#add-budget-line").click();
};

describe("create budget lines workflow", () => {
    it("should complete the workflow", () => {
        completeStepOne();
        completeStepTwo();
        createBudgetLine(blData[0]);
        cy.get("@tsc").should("contain", "Draft Total").and("contain", "$ 111,111.00");
    });
});
