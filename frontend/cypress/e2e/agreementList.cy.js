/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";
import { TABLE_HEADINGS_LIST } from "../../src/components/Agreements/AgreementsTable/AgreementsTable.constants";

describe("Agreement List", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit("/agreements");
        cy.wait(8000);
    });

    afterEach(() => {
        cy.wait(4000);
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("loads", () => {
        cy.get("h1").should("have.text", "Agreements");
    });

    it("Agreements list table has correct headers and first row", () => {
        cy.get(".usa-table").should("exist");
        cy.get("h1").should("exist");
        cy.get("h1").should("have.text", "Agreements");
        // table headers
        cy.get("thead > tr > :nth-child(1)").should("have.text", "Agreement");
        cy.get("thead > tr > :nth-child(2)").should("have.text", "Project");
        cy.get("thead > tr > :nth-child(3)").should("have.text", "Type");
        cy.get("thead > tr > :nth-child(4)").should("have.text", "Agreement Total");
        cy.get("thead > tr > :nth-child(5)").should("have.text", "Next Budget Line");
        cy.get("thead > tr > :nth-child(6)").should("have.text", "Next Obligate By");

        // select the row with data-testid="agreement-table-row-9"
        cy.get("[data-testid='agreement-table-row-9']").should("exist");

        // 4th row (including tooltips)
        cy.get(
            "tbody > [data-testid='agreement-table-row-9'] > :nth-child(1) > a > .usa-tooltip > .usa-tooltip__trigger"
        ).should("have.text", "Interoperability Initiatives");
        cy.get(
            "tbody > [data-testid='agreement-table-row-9'] > :nth-child(1) > a > .usa-tooltip > .usa-tooltip__body"
        ).should("have.text", "Interoperability Initiatives");
        cy.get(
            "tbody > [data-testid='agreement-table-row-9'] > :nth-child(2) > .usa-tooltip > .usa-tooltip__trigger"
        ).should("have.text", "Annual Performance Plans and Reports");
        cy.get(
            "tbody > [data-testid='agreement-table-row-9'] > :nth-child(2) > .usa-tooltip > .usa-tooltip__body"
        ).should("have.text", "Annual Performance Plans and Reports");
        cy.get("tbody > [data-testid='agreement-table-row-9'] > :nth-child(3)").should("have.text", "Contract");
        cy.get("tbody > [data-testid='agreement-table-row-9'] > :nth-child(4)").should("have.text", "$1,000,000.00");
        cy.get("tbody > [data-testid='agreement-table-row-9'] > :nth-child(5)").should("have.text", "$703,500.00");
        cy.get("tbody > [data-testid='agreement-table-row-9'] > :nth-child(6)").should("have.text", "6/13/2043");

        cy.get("[data-testid='agreement-table-row-9']").trigger("mouseover");
        cy.get("button[id^='submit-for-approval-']").first().should("exist");
        cy.get("button[id^='submit-for-approval-']").first().should("not.be.disabled");

        // expand 4th row
        cy.get(':nth-child(1) > :nth-child(7) > [data-cy="expand-row"]').should("exist");
        cy.get(':nth-child(1) > :nth-child(7) > [data-cy="expand-row"]').click();
        cy.get(".padding-right-9 > :nth-child(1) > :nth-child(1)").should("have.text", "Created By");
        cy.get(".width-mobile > .text-base-dark").should("have.text", "Description");
        cy.get('[style="margin-left: 3.125rem;"] > .text-base-dark').should("have.text", "Budget Lines");
    });

    it("navigates to the ReviewAgreements page when the review button is clicked", () => {
        cy.get(".usa-table").should("exist");
        cy.get("[data-testid='agreement-table-row-9']").trigger("mouseover");
        cy.get("button[id^='submit-for-approval-']").first().should("exist");
        cy.get("button[id^='submit-for-approval-']").first().should("not.be.disabled");
        cy.get("button[id^='submit-for-approval-']").first().click();
        cy.url().should("include", "/agreements/review");
        cy.get("h1").should("exist");
        cy.get("h1").should("have.text", "Request BL Status Change");
    });

    it("Agreements Table is correctly filtered on all-agreements or my-agreements", () => {
        cy.visit("/agreements");
        cy.get("tbody").children().should("have.length", 11);

        cy.visit("/agreements?filter=my-agreements");
        cy.get("tbody").children().should("have.length", 7);
    });

    it("the filter button works as expected", () => {
        cy.visit("/agreements?filter=all-agreements");
        cy.wait(1000);
        cy.get("button").contains("Filter").click();

        // set a number of filters
        // get select element by name "project-react-select"

        // Split the chain to avoid unsafe subject usage
        cy.get(".fiscal-year-combobox__control").click();
        cy.get(".fiscal-year-combobox__menu").find(".fiscal-year-combobox__option").first().click();

        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").find(".portfolios-combobox__option").first().click();

        cy.get(".bli-status-combobox__control").click();
        cy.get(".bli-status-combobox__menu").find(".bli-status-combobox__option").first().click();

        // click the button that has text Apply
        cy.get("button").contains("Apply").click();

        // check that the correct tags are displayed
        cy.get("div").contains("FY 2044").should("exist");
        cy.get("div").contains("Adolescent Development Research").should("exist");
        cy.get("div").contains("Draft").should("exist");

        // check that the table is filtered correctly
        cy.get("div[id='agreements-table-zero-results']").should("exist");

        // reset
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        // check that no tags are displayed
        cy.get("div").contains("FY 2044").should("not.exist");
        cy.get("div").contains("Child Welfare Research").should("not.exist");
        cy.get("div").contains("Planned").should("not.exist");

        // check that the table is filtered correctly
        cy.get("div[id='agreements-table-zero-results']").should("not.exist");
    });

    it("clicking the add agreement button takes you to the create agreement page", () => {
        cy.visit("/agreements?filter=all-agreements");
        cy.get("a").contains("Add Agreement").click();
        cy.url().should("include", "/agreements/create");
    });

    it("Change Requests tab works", () => {
        cy.visit("/agreements?filter=change-requests");
        cy.wait(1000);
        cy.get("h2").should("have.text", "For Review");
        cy.get(".text-center")
            .invoke("text")
            .should("match", /no changes/i);
    });

    it("Should allow the user to export table", () => {
        cy.get('[data-cy="agreement-export"]').should("exist");
        cy.get("button").contains("Filter").click();
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.get(".portfolios-combobox__control")
            .click()
            .get(".portfolios-combobox__menu")
            .find(".portfolios-combobox__option")
            .contains("Home Visiting")
            .click();
        cy.get("button").contains("Apply").click();
        cy.get('[data-cy="agreement-export"]').should("not.exist");
    });

    it("Should not allow user to edit an agreement that is not developed", () => {
        cy.get("[data-testid='agreement-table-row-2']").trigger("mouseover");
        cy.get("[data-testid='agreement-table-row-2']").find('[data-cy="edit-row"]').should("be.disabled");
    });

    it("Should allow user to edit an obligated agreement", () => {
        cy.get("[data-testid='agreement-table-row-7']").trigger("mouseover");
        cy.get("[data-testid='agreement-table-row-7']").find('[data-cy="edit-row"]').should("not.be.disabled");
    });

    it("Should sort the table by clicking on the header", () => {
        // Sort table by agreement name
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[0].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("contain", "Support Contract #1");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("contain", "MIHOPE Long-Term");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("contain", "MIHOPE Check-In");
        // Sort by agreement name ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[0].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should(
            "contain",
            "CONTRACT #2: Fathers and Continuous Learning (FCL)"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should(
            "contain",
            "Contract #1: African American Child and Family Research Center"
        );
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("contain", "Contract Workflow Test");

        // Sort table by project name descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[1].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should(
            "contain",
            "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should(
            "contain",
            "IAA #1: Early Care and Education Leadership Study (ExCELS)"
        );
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("contain", "Support Contract #1");
        // Sort by project name ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[1].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should(
            "contain",
            "CONTRACT #2: Fathers and Continuous Learning (FCL)"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("contain", "Interoperability Initiatives");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should(
            "contain",
            "IAA-AA #1: Fathers and Continuous Learning (FCL)"
        );

        // Sort table by project name descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[2].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should(
            "contain",
            "IAA-AA #1: Fathers and Continuous Learning (FCL)"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should(
            "contain",
            "IAA #1: Early Care and Education Leadership Study (ExCELS)"
        );
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should(
            "contain",
            "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        );
        // Sort by project name ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[2].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should(
            "contain",
            "CONTRACT #2: Fathers and Continuous Learning (FCL)"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("contain", "MIHOPE Long-Term");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("contain", "Support Contract #1");

        // Sort table by agreement total descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[3].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should(
            "contain",
            "Contract #1: African American Child and Family Research Center"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should(
            "contain",
            "DIRECT ALLOCATION #2: African American Child and Family Research Center"
        );
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should(
            "contain",
            "CONTRACT #2: Fathers and Continuous Learning (FCL)"
        );
        // Sort by agreement total ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[3].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should(
            "contain",
            "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should(
            "contain",
            "IAA #1: Early Care and Education Leadership Study (ExCELS)"
        );
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should(
            "contain",
            "IAA-AA #1: Fathers and Continuous Learning (FCL)"
        );

        // Sort table by next budget line descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[4].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should(
            "contain",
            "Contract #1: African American Child and Family Research Center"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("contain", "Contract Workflow Test");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should(
            "contain",
            "DIRECT ALLOCATION #2: African American Child and Family Research Center"
        );
        // Sort by next budget line ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[4].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should(
            "contain",
            "CONTRACT #2: Fathers and Continuous Learning (FCL)"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should(
            "contain",
            "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        );
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should(
            "contain",
            "IAA #1: Early Care and Education Leadership Study (ExCELS)"
        );

        // Sort table by next obligate by descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[5].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("contain", "Support Contract #1");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("contain", "MIHOPE Check-In");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("contain", "MIHOPE Long-Term");
        // Sort by next obligate by ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[5].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should(
            "contain",
            "CONTRACT #2: Fathers and Continuous Learning (FCL)"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should(
            "contain",
            "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        );
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should(
            "contain",
            "IAA #1: Early Care and Education Leadership Study (ExCELS)"
        );
    });
});
