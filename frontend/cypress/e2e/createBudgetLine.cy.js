/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

before(() => {
    testLogin("admin");
    cy.visit("/budget-lines/create");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

const completeStepOne = () => {
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
    cy.get("#project-combobox-input").type("Human Services Interoperability Support{enter}");
    // summary card should exist after project is selected
    cy.get('[data-cy="project-summary-card"]').should("exist");
    // agreement should be enabled after project is selected
    cy.get("#agreement").should("not.be.disabled");
    cy.get("#agreement").select(1);
    cy.get('[data-cy="agreement-summary-card"]').should("exist");
    cy.get('[data-cy="agreement-summary-card"]')
        .should("contain", "Contract #1: African American Child and Family Research Center")
        .and("contain", "Test description")
        .and("contain", "Chris Fortunato");
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
};

it("complete steps one and two and then cancel", () => {
    completeStepOne();
    completeStepTwo();
    cy.get("[data-cy='back-button']").click();
    // check that we are back on the create budget lines page
    cy.get(".usa-step-indicator__segment--current").should("contain", "Project & Agreement");
});

// TODO: test duplicate existing budget line
