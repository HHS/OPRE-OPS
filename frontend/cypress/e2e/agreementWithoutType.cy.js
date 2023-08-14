/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";
const testAgreement = {
    // agreement_type: "CONTRACT",
    agreement_reason: "NEW_REQ",
    name: "Test Contract",
    number: "TEST001",
    description: "Test Description",
    research_project_id: 1,
    product_service_code_id: 1,
    procurement_shop_id: 1,
    incumbent: "Test Vendor",
    project_officer: 1,
    team_members: [
        {
            id: 3,
        },
        {
            id: 5,
        },
    ],
    notes: "Test Notes",
};

const addAgreement = (agreement) => {
    expect(localStorage.getItem("access_token")).to.exist;

    // create test agreement
    const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
    cy.request({
        method: "POST",
        url: "http://localhost:8080/api/v1/agreements/",
        body: agreement,
        headers: {
            Authorization: bearer_token,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });
};

beforeEach(() => {
    testLogin("admin");
    cy.visit("/agreements/");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads with 8 agreements", () => {
    cy.get("tbody").children().as("table-rows").should("have.length", 8);
});

it("handles agreementwithout Type by redirecting to Error page", () => {
    cy.intercept("POST", "**/agreements").as("postAgreement");
    cy.get("tbody").children().as("table-rows").should("have.length", 8);
    addAgreement(testAgreement);
    cy.wait("@postAgreement")
        .then((interception) => {
            const { statusCode, body } = interception.response;
            expect(statusCode).to.equal(401);
            // expect(body.message).to.equal("Agreement created");
        })
        .then(cy.log);
});
