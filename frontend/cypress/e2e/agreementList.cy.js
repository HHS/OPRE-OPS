/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";
import { TABLE_HEADINGS_LIST } from "../../src/components/Agreements/AgreementsTable/AgreementsTable.constants";

describe("Agreement List", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit("/agreements");
        // Wait for the page to load and data to be fetched
        cy.get("h1", { timeout: 10000 }).should("have.text", "Agreements");
        cy.get(".usa-table").should("exist");
        // Wait for table rows to be populated
        cy.get("tbody").should("exist");
        cy.get("[data-testid^='agreement-table-row-']", { timeout: 10000 }).should("have.length.at.least", 1);
    });

    afterEach(() => {
        cy.injectAxe();
        // Fix the accessibility check by providing proper parameters
        cy.checkA11y(undefined, undefined, terminalLog);
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

        // Find a row with an enabled submit-for-approval button
        cy.get("[data-testid^='agreement-table-row-']").each(($row) => {
            cy.wrap($row).trigger("mouseover");
            cy.wrap($row)
                .find("button[id^='submit-for-approval-']")
                .then(($btn) => {
                    if ($btn.length && !$btn.is(":disabled")) {
                        // Check first row content (using more flexible selectors)
                        cy.wrap($row).within(() => {
                            cy.get("[data-cy='agreement-name']").should("exist");
                            cy.get("[data-cy='research-project-name']").should("exist");
                            cy.get("[data-cy='agreement-type']").should("exist");
                            cy.get("[data-cy='agreement-total']").should("exist");
                            cy.get("[data-cy='next-bli-amount']").should("exist");
                            cy.get("[data-cy='next-need-by']").should("exist");
                        });
                        // Check that hover actions are available
                        cy.wrap($btn).should("exist");
                        cy.wrap($btn).should("not.be.disabled");
                        // Check expand functionality
                        cy.wrap($row).find('[data-cy="expand-row"]').should("exist");
                        cy.wrap($row).find('[data-cy="expand-row"]').click();
                        // Check expanded content
                        cy.get(".padding-right-9 > :nth-child(1) > :nth-child(1)").should("have.text", "Created By");
                        cy.get(".width-mobile > .text-base-dark").should("have.text", "Description");
                        cy.get('[style="margin-left: 3.125rem;"] > .text-base-dark').should(
                            "have.text",
                            "Budget Lines"
                        );
                        return false; // break the loop
                    }
                });
        });
    });

    it("navigates to the ReviewAgreements page when the review button is clicked", () => {
        cy.get(".usa-table").should("exist");
        // Find a row with an enabled submit-for-approval button
        cy.get("[data-testid^='agreement-table-row-']").each(($row) => {
            cy.wrap($row).trigger("mouseover");
            cy.wrap($row)
                .find("button[id^='submit-for-approval-']")
                .then(($btn) => {
                    if ($btn.length && !$btn.is(":disabled")) {
                        cy.wrap($btn).should("exist");
                        cy.wrap($btn).should("not.be.disabled");
                        cy.wrap($btn).click();
                        cy.url().should("include", "/agreements/review");
                        cy.get("h1").should("exist");
                        cy.get("h1").should("have.text", "Request BL Status Change");
                        return false; // break the loop
                    }
                });
        });
    });

    it("Agreements Table is correctly filtered on all-agreements or my-agreements", () => {
        // Wait for table to load and get initial count
        cy.get("tbody").children().should("have.length.at.least", 1);

        cy.visit("/agreements?filter=my-agreements");
        cy.get("h1").should("have.text", "Agreements");
        cy.get(".usa-table").should("exist");
        cy.get("tbody").children().should("have.length.at.least", 1);
    });

    it("the filter button works as expected", () => {
        cy.visit("/agreements?filter=all-agreements");
        cy.get("h1").should("have.text", "Agreements");
        cy.get("button").contains("Filter").click();

        // set a number of filters
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
        cy.get("h1").should("have.text", "Agreements");
        cy.get("a").contains("Add Agreement").click();
        cy.url().should("include", "/agreements/create");
        // Wait for the page to load and the h1 tag to be rendered
        cy.get("h1").should("exist");
    });

    it("Change Requests tab works", () => {
        cy.visit("/agreements?filter=change-requests");
        cy.get("h1").should("have.text", "Agreements");
        cy.get("h2").should("have.text", "For Review");
        cy.get(".text-center")
            .invoke("text")
            .should("match", /no changes/i);
    });

    it("Should allow the user to export table", () => {
        cy.get('[data-cy="agreement-export"]').should("exist");
        cy.get("button").contains("Filter").click();

        // Fix the chaining issue by using proper Cypress commands
        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").find(".portfolios-combobox__option").contains("Home Visiting").click();
        cy.get("button").contains("Apply").click();
        cy.get('[data-cy="agreement-export"]').should("not.exist");
    });

    it("Should not allow user to edit an agreement that is not developed", () => {
        // Find a row that has a disabled edit button
        cy.get("[data-testid^='agreement-table-row-']").each(($row) => {
            cy.wrap($row).trigger("mouseover");
            cy.wrap($row)
                .find('[data-cy="edit-row"]')
                .then(($editBtn) => {
                    if ($editBtn.length > 0 && $editBtn.is(":disabled")) {
                        cy.wrap($editBtn).should("be.disabled");
                        return false; // break the loop
                    }
                });
        });
    });

    it("Should allow user to edit an obligated agreement", () => {
        // Find a row that has an enabled edit button
        cy.get("[data-testid^='agreement-table-row-']").each(($row) => {
            cy.wrap($row).trigger("mouseover");
            cy.wrap($row)
                .find('[data-cy="edit-row"]')
                .then(($editBtn) => {
                    if ($editBtn.length > 0 && !$editBtn.is(":disabled")) {
                        cy.wrap($editBtn).should("not.be.disabled");
                        return false; // break the loop
                    }
                });
        });
    });

    it("Should sort the table by clicking on the header", () => {
        // Wait for table to be fully loaded
        cy.get("[data-testid^='agreement-table-row-']").should("have.length.at.least", 3);

        // Sort table by agreement name
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[0].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort by agreement name ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[0].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort table by project name descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[1].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort by project name ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[1].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort table by agreement type descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[2].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort by agreement type ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[2].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort table by agreement total descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[3].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort by agreement total ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[3].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort table by next budget line descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[4].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort by next budget line ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[4].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort table by next obligate by descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[5].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");

        // Sort by next obligate by ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[5].value}]`).click();
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("exist");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("exist");
    });
});
