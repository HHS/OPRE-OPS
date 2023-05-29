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
    {
        descr: "SC3",
        can: "G99HRF2",
        month: "09 - Sep",
        day: "23",
        year: "2023",
        amount: "333333",
        note: "note three",
    },
];

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
    cy.get('[data-cy="total-summary-cards"]').as("tsc").should("exist");
    cy.get("@tsc").should("contain", "Draft Total").and("contain", "$0.00");
};

const completeCreateBudgetLines = () => {
    cy.get("tbody").children().as("table-rows").should("have.length", 2);
    createBudgetLine(blData[0]);
    cy.get("@tsc").should("contain", "Draft Total").and("contain", "$ 111,111.00");
    cy.get("@table-rows").should("have.length", 3);
    createBudgetLine(blData[1]);
    cy.get("@tsc").should("contain", "Draft Total").and("contain", "$ 333,333.00");
    cy.get("@table-rows").should("have.length", 4);
    // duplicate the first row
    cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
    cy.get("[data-cy='duplicate-row']").click();
    cy.get("@table-rows").should("have.length", 5);
    // edit the first row
    cy.get("@table-rows").eq(0).find("[data-cy='expand-row']").click();
    cy.get("[data-cy='edit-row']").click();
    cy.get("#bl-description").clear().type(blData[2].descr);
    cy.get("#bl-amount").clear().type(blData[2].amount);
    cy.get("#with-hint-textarea").clear().type(blData[2].note);
    cy.get("[data-cy='update-budget-line']").click();
    cy.get("@table-rows").eq(0).should("contain", blData[2].descr);
    cy.get("@tsc").should("contain", "Draft Total").and("contain", "$ 666,666.00");
    // delete the second row
    cy.get("@table-rows").eq(1).find("[data-cy='expand-row']").click();
    cy.get("[data-cy='delete-row']").click();
    cy.get("[data-cy='confirm-action']").click(); // modal confirm
    cy.get("@table-rows").should("have.length", 4);
    cy.get("@tsc").should("contain", "Draft Total").and("contain", "$ 444,444.00");
    //post the budget lines
    cy.get("[data-cy='step-two-continue']").click();
    cy.wait("@postBudgetLines")
        .then((interception) => {
            const { statusCode } = interception.response;
            expect(statusCode).to.equal(201);
        })
        .then(cy.log);
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
        cy.intercept("POST", "**/budget-line-items").as("postBudgetLines");
        completeStepOne();
        completeStepTwo();
        completeCreateBudgetLines();
    });
    it("should handle cancelling out of workflow", () => {
        cy.visit("/budget-lines/create");
        completeStepOne();
        completeStepTwo();
        cy.get("[data-cy='back-button']").click();
        cy.get('[data-cy="confirm-action"]').click();
        // check that we are back on the create budget lines page
        cy.get(".usa-step-indicator__segment--current").should("contain", "Project & Agreement");
    });

    // TODO: test duplicate existing budget line
});
