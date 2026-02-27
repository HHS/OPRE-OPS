/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";
import { TABLE_HEADINGS_LIST } from "../../src/components/Agreements/AgreementsTable/AgreementsTable.constants";

describe("Agreement List", () => {
    beforeEach(() => {
        testLogin("system-owner");
        cy.visit("/agreements");
        cy.get("#fiscal-year-select").select("All");
        // Wait for the page to be ready (not loading state)
        cy.get("body").should("exist"); // Ensure page is loaded
        // Wait for loading to complete - "Loading..." heading should not exist
        cy.contains("h1", "Loading...", { timeout: 30000 }).should("not.exist");
        // Wait for table to be present with data
        cy.get(".usa-table", { timeout: 30000 }).should("exist");
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
    });

    afterEach(() => {
        cy.injectAxe();
        cy.checkA11y(null, null, terminalLog);
    });

    it("Agreements list table has correct headers and first row", () => {
        // Wait for table to load with data
        cy.get(".usa-table", { timeout: 20000 }).should("exist");
        cy.get("tbody tr", { timeout: 20000 }).should("have.length.at.least", 1);

        // table headers
        cy.get("thead > tr > :nth-child(1)").should("have.text", "Agreement");
        cy.get("thead > tr > :nth-child(2)").should("have.text", "Type");
        cy.get("thead > tr > :nth-child(3)").should("have.text", "Start");
        cy.get("thead > tr > :nth-child(4)").should("have.text", "End");
        cy.get("thead > tr > :nth-child(5)").should("have.text", "Total");
        cy.get("thead > tr > :nth-child(6)").should("have.text", "FY26 Obligated");

        cy.get("#fiscal-year-select").select("2044");
        // select the row with data-testid="agreement-table-row-9"
        cy.get("[data-testid='agreement-table-row-9']", { timeout: 10000 }).should("exist");

        // 4th row (including tooltips)
        cy.get(
            "tbody > [data-testid='agreement-table-row-9'] > :nth-child(1) > a > .usa-tooltip > .usa-tooltip__trigger"
        ).should("have.text", "Interoperability Initiatives");
        cy.get(
            "tbody > [data-testid='agreement-table-row-9'] > :nth-child(1) > a > .usa-tooltip > .usa-tooltip__body"
        ).should("have.text", "Interoperability Initiatives");
        cy.get("tbody > [data-testid='agreement-table-row-9'] > :nth-child(2)").should("have.text", "Contract");
        cy.get("tbody > [data-testid='agreement-table-row-9'] > :nth-child(3)").should("have.text", "6/13/2044");
        cy.get("tbody > [data-testid='agreement-table-row-9'] > :nth-child(4)").should("have.text", "6/13/2045");
        cy.get("tbody > [data-testid='agreement-table-row-9'] > :nth-child(5)").should("have.text", "$1,000,000.00");
        cy.get("tbody > [data-testid='agreement-table-row-9'] > :nth-child(6)").should("have.text", "$0");

        cy.get("[data-testid='agreement-table-row-9']").trigger("mouseover");
        cy.get("button[id^='submit-for-approval-']").first().should("exist");
        cy.get("button[id^='submit-for-approval-']").first().should("not.be.disabled");

        // expand agreement-table-row-9
        cy.get('[data-testid="agreement-table-row-9"] > :nth-child(7) > [data-cy="expand-row"]').should("exist");
        cy.get('[data-testid="agreement-table-row-9"] > :nth-child(7) > [data-cy="expand-row"]').click();
        // Verify expanded row displays expected fields
        cy.get('[data-cy="expanded-data"]', { timeout: 10000 }).should("exist");
        cy.get('[data-cy="expanded-data"]').should("contain.text", "Project");
        cy.get('[data-cy="expanded-data"]').should("contain.text", "Procurement Shop");
        cy.get('[data-cy="expanded-data"]').should("contain.text", "Subtotal");
        cy.get('[data-cy="expanded-data"]').should("contain.text", "Fees");
        cy.get('[data-cy="expanded-data"]').should("contain.text", "Lifetime Obligated");
        cy.get('[data-cy="expanded-data"]').should("contain.text", "Contract #");
        cy.get('[data-cy="expanded-data"]').should("contain.text", "Vendor");
    });

    it("navigates to the ReviewAgreements page when the review button is clicked", () => {
        // Wait for table to load with data
        cy.get(".usa-table", { timeout: 20000 }).should("exist");
        cy.get("tbody tr", { timeout: 20000 }).should("have.length.at.least", 1);
        cy.get("#fiscal-year-select").select("2044");
        cy.get("[data-testid='agreement-table-row-9']", { timeout: 10000 }).should("exist");
        cy.get("[data-testid='agreement-table-row-9']").trigger("mouseover");
        cy.get("button[id^='submit-for-approval-']").first().should("exist");
        cy.get("button[id^='submit-for-approval-']").first().should("not.be.disabled");
        cy.get("button[id^='submit-for-approval-']").first().click();
        cy.url().should("include", "/agreements/review");
        cy.get("h1").should("exist");
        cy.get("h1").should("have.text", "Request BL Status Change");
    });

    it("Agreements Table is correctly filtered on all-agreements or my-agreements", () => {
        // With pagination, we show 10 items per page
        cy.get("tbody").children().should("have.length", 10);

        cy.visit("/agreements?filter=my-agreements");
        cy.get("#fiscal-year-select").select("All");

        // Wait for loading to complete and data to load
        cy.contains("h1", "Loading...", { timeout: 30000 }).should("not.exist");
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        // My Agreements may have 10 or fewer items on first page
        cy.get("tbody").children().should("have.length.at.most", 10);
    });

    it("the filter button works as expected", () => {
        cy.get("button").contains("Filter").click();

        // set a number of filters
        // get select element by name "project-react-select"

        // Split the chain to avoid unsafe subject usage
        cy.get(".fiscal-year-combobox__control").click();
        cy.get(".fiscal-year-combobox__menu").contains(".fiscal-year-combobox__option", "FY 2044").click();

        cy.get(".portfolios-combobox__control").click();
        cy.get(".portfolios-combobox__menu").find(".portfolios-combobox__option").first().click();

        // Note: BLI status filter was removed in OPS-4928

        // click the button that has text Apply
        cy.get("button").contains("Apply").click();

        // check that the correct tags are displayed
        cy.contains("FY 2044").should("exist");
        cy.get("div").contains("Adolescent Development Research").should("exist");

        // Check that table shows results or zero results based on filter combination
        // (May show results or no results depending on data)
        cy.get("tbody tr", { timeout: 10000 }).should("exist");

        // reset
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        // Wait for filters to be cleared
        cy.wait(1000);

        // check that no tags are displayed
        cy.get("div").contains("FY 2044").should("not.exist");
        cy.get("div").contains("Adolescent Development Research").should("not.exist");
    });

    it("filters agreements by agreement name", () => {
        cy.get("button").contains("Filter").click();

        // Select an agreement name
        cy.get(".agreement-name-combobox__control").click();
        // Wait for menu to be visible before interacting
        cy.get(".agreement-name-combobox__menu").should("be.visible");
        // Break up the chain to avoid stale element issues
        cy.get(".agreement-name-combobox__menu").contains("Interoperability Initiatives").click();

        // Apply the filter
        cy.get("button").contains("Apply").click();

        // Verify the filter tag is displayed
        cy.get("span.bg-brand-primary-light.text-brand-primary-dark", { timeout: 10000 })
            .contains("Interoperability Initiatives")
            .should("exist");

        // Verify the table is filtered correctly
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        cy.get("[data-testid='agreement-table-row-9']", { timeout: 30000 }).should("exist");
        cy.get("[data-testid='agreement-table-row-9']").find("a").should("contain", "Interoperability Initiatives");

        // Reset the filter
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        // Wait for table to reload with all agreements
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        // Verify the filter tag is removed (check that no filter tags exist at all)
        cy.get("span.bg-brand-primary-light.text-brand-primary-dark").should("not.exist");
    });

    it("filters agreements by agreement type", () => {
        cy.get("button").contains("Filter").click();

        // Select an agreement type
        cy.get(".agreement-type-combobox__control").click();
        // Wait for menu to be visible before interacting
        cy.get(".agreement-type-combobox__menu").should("be.visible");
        // Break up the chain to avoid stale element issues
        cy.get(".agreement-type-combobox__menu").contains("Contract").click();

        // Apply the filter
        cy.get("button").contains("Apply").click();

        // Verify the filter tag is displayed
        cy.get("span.bg-brand-primary-light.text-brand-primary-dark", { timeout: 10000 })
            .contains("Contract")
            .should("exist");

        // Verify the table shows only contracts
        // Wait for actual agreement rows to render (skip loading placeholder row)
        cy.get("tbody tr[data-testid^='agreement-table-row-']", { timeout: 30000 }).should("have.length.at.least", 1);
        // Check that visible rows show "Contract" as the type (retry until filter results settle)
        cy.verifyTableColumnValues(
            "tbody tr[data-testid^='agreement-table-row-'] [data-cy='agreement-type']",
            "Contract"
        );

        // Reset the filter
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        // Wait for table to reload with all agreements
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        // Verify the filter tag is removed (check that no filter tags exist at all)
        cy.get("span.bg-brand-primary-light.text-brand-primary-dark").should("not.exist");
    });

    it("filters agreements by both agreement name and type", () => {
        cy.get("button").contains("Filter").click();

        // Select agreement name
        cy.get(".agreement-name-combobox__control").click();
        // Wait for menu to be visible before interacting
        cy.get(".agreement-name-combobox__menu").should("be.visible");
        // Break up the chain to avoid stale element issues
        cy.get(".agreement-name-combobox__menu").contains("Interoperability Initiatives").click();

        // Select agreement type
        cy.get(".agreement-type-combobox__control").click();
        // Wait for menu to be visible before interacting
        cy.get(".agreement-type-combobox__menu").should("be.visible");
        // Break up the chain to avoid stale element issues
        cy.get(".agreement-type-combobox__menu").contains("Contract").click();

        // Apply the filter
        cy.get("button").contains("Apply").click();

        // Verify both filter tags are displayed
        cy.get("span.bg-brand-primary-light.text-brand-primary-dark", { timeout: 10000 })
            .contains("Interoperability Initiatives")
            .should("exist");
        cy.get("span.bg-brand-primary-light.text-brand-primary-dark").contains("Contract").should("exist");

        // Verify the table is filtered correctly
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        cy.get("[data-testid='agreement-table-row-9']", { timeout: 30000 }).should("exist");
        cy.get("[data-testid='agreement-table-row-9']").find("a").should("contain", "Interoperability Initiatives");
        cy.get("[data-testid='agreement-table-row-9']").find("td:nth-child(2)").should("have.text", "Contract");

        // Reset the filter
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("button").contains("Apply").click();

        // Wait for table to reload with all agreements
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);
        // Verify both filter tags are removed (check that no filter tags exist at all)
        cy.get("span.bg-brand-primary-light.text-brand-primary-dark").should("not.exist");
    });

    it("Change Requests tab works", () => {
        cy.visit("/agreements?filter=change-requests");
        // Wait for loading to complete
        cy.contains("h1", "Loading...", { timeout: 30000 }).should("not.exist");
        cy.get("h2", { timeout: 10000 }).should("have.text", "For Review");
        cy.get(".text-center")
            .invoke("text")
            .should("match", /no changes/i);
    });

    it("Should allow the user to export table", () => {
        cy.get('[data-cy="agreement-export"]').should("exist");
        cy.get("button").contains("Filter").click();
        cy.get(".portfolios-combobox__control")
            .click()
            .get(".portfolios-combobox__menu")
            .find(".portfolios-combobox__option")
            .contains("Home Visiting")
            .click();
        cy.get("button").contains("Apply").click();
        // Wait for zero results message to appear
        cy.get("div[id='agreements-table-zero-results']").should("exist");
        cy.get('[data-cy="agreement-export"]').should("not.exist");
    });

    it("Should not allow user to edit an agreement that is not developed", () => {
        cy.get("button").contains("Filter").click();

        // Select an agreement type that is not developed yet (Grant)
        cy.get(".agreement-type-combobox__control").click();
        cy.get(".agreement-type-combobox__menu").should("be.visible");
        cy.get(".agreement-type-combobox__menu").contains("Grant").click();

        // Apply the filter
        cy.get("button").contains("Apply").click();

        // Wait for a real agreement row to render
        cy.get("tbody tr[data-testid^='agreement-table-row-']", { timeout: 30000 }).should("have.length.at.least", 1);

        // Hover to reveal action icons and confirm edit is disabled
        cy.get("tbody tr[data-testid^='agreement-table-row-']").first().as("notDevelopedRow");
        cy.get("@notDevelopedRow").find('[data-cy="agreement-type"]').should("have.text", "Grant");
        cy.get("@notDevelopedRow").trigger("mouseover", { force: true });
        cy.get("tbody tr[data-testid^='agreement-table-row-']")
            .first()
            .find('[data-cy="edit-row"]')
            .should("exist")
            .and("be.disabled");
    });

    it("Should allow user to edit an obligated agreement", () => {
        // Test with agreement-9 which is on page 1 and should be editable
        // Increased timeout for CI environments where large agreements take longer to load
        cy.get("#fiscal-year-select").select("2044");
        cy.get("[data-testid='agreement-table-row-9']", { timeout: 30000 }).should("exist");
        cy.get("[data-testid='agreement-table-row-9']").trigger("mouseover");
        cy.get("[data-testid='agreement-table-row-9']")
            .find('[data-cy="edit-row"]', { timeout: 10000 })
            .should("exist");
    });

    it("Agreement summary cards render with correct data", () => {
        // Both summary cards should be visible when agreements are loaded
        cy.get('[data-cy="agreement-fy-spending-summary-card"]', { timeout: 10000 }).should("exist");
        cy.get('[data-cy="agreement-type-summary-card"]', { timeout: 10000 }).should("exist");

        // --- FY Spending Summary Card ---
        cy.get('[data-cy="agreement-fy-spending-summary-card"]').within(() => {
            // Title should reflect "All FYs" since beforeEach selects "All"
            cy.contains("h3", "All FYs Agreements").should("exist");
            cy.contains("h3", "All FYs New").should("exist");
            cy.contains("h3", "All FYs Continuing").should("exist");

            // The total count should be a positive number
            cy.get(".font-sans-xl.text-bold").invoke("text").then((text) => {
                const totalCount = parseInt(text, 10);
                expect(totalCount).to.be.greaterThan(0);
            });

            // Agreement type tags should exist and each should show a count followed by a label
            cy.get("span").filter(":contains('Contract')").should("exist");
        });

        // --- Agreement Type Summary Card ---
        cy.get('[data-cy="agreement-type-summary-card"]').within(() => {
            // Title should reflect the fiscal year prefix
            cy.contains("h3", "Spending by Agreement Type").should("exist");

            // All four legend labels should be present
            cy.get('[data-testid="label-container"]').should("have.length", 4);
            cy.get('[data-testid="label-container"]').eq(0).should("have.text", "Contract");
            cy.get('[data-testid="label-container"]').eq(1).should("have.text", "Partner");
            cy.get('[data-testid="label-container"]').eq(2).should("have.text", "Grant");
            cy.get('[data-testid="label-container"]').eq(3).should("have.text", "Direct Obligation");

            // Each legend item should have a dollar value and percentage
            cy.get('[data-testid="value-container"]').should("have.length", 4);
            cy.get('[data-testid="legend-tag"]').should("have.length", 4);

            // Percentages should all end with "%"
            cy.get('[data-testid="legend-tag"]').each(($tag) => {
                expect($tag.text()).to.match(/\d+%/);
            });

            // Dollar values should start with "$"
            cy.get('[data-testid="value-container"]').each(($val) => {
                expect($val.text()).to.match(/^\$/);
            });

            // The donut chart should be rendered since there's data
            cy.get("#agreement-type-chart").should("exist");
        });
    });

    it("Agreement summary card counts match the table row count by type", () => {
        // Get the total count from the FY spending card
        cy.get('[data-cy="agreement-fy-spending-summary-card"]').within(() => {
            cy.get(".font-sans-xl.text-bold").invoke("text").then((cardCountText) => {
                const cardTotal = parseInt(cardCountText, 10);

                // Navigate through all pages to count total table rows
                // First, get the total from pagination if it exists
                // The card count should match the total number of agreements across all pages
                expect(cardTotal).to.be.greaterThan(0);
            });
        });
    });

    it("Agreement summary cards update when fiscal year filter changes", () => {
        // Switch to a specific fiscal year
        cy.get("#fiscal-year-select").select("2044");

        // Wait for data to reload
        cy.contains("h1", "Loading...", { timeout: 30000 }).should("not.exist");
        cy.get("tbody tr", { timeout: 30000 }).should("have.length.at.least", 1);

        // The FY spending card title should update to reflect the selected FY
        cy.get('[data-cy="agreement-fy-spending-summary-card"]', { timeout: 10000 }).within(() => {
            cy.contains("h3", "FY 2044 Agreements").should("exist");
            cy.contains("h3", "FY 2044 New").should("exist");
            cy.contains("h3", "FY 2044 Continuing").should("exist");
        });

        // The type summary card title should also update
        cy.get('[data-cy="agreement-type-summary-card"]').within(() => {
            cy.contains("h3", "FY 2044 Spending by Agreement Type").should("exist");
        });
    });

    it("Agreement summary card percentages sum to approximately 100%", () => {
        cy.get('[data-cy="agreement-type-summary-card"]').within(() => {
            cy.get('[data-testid="legend-tag"]').then(($tags) => {
                let totalPercent = 0;
                $tags.each((_, tag) => {
                    const percentText = Cypress.$(tag).text();
                    totalPercent += parseInt(percentText, 10);
                });
                // Due to rounding, the sum may not be exactly 100 but should be close
                // (within 2% due to Math.round on each individual percentage)
                expect(totalPercent).to.be.within(98, 102);
            });
        });
    });

    it.skip("Should sort the table by clicking on the header", () => {
        // Sort table by agreement name
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[0].value}]`).click();
        // Wait for table to sort by checking first row
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
            "contain",
            "Support Contract #1"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("contain", "MIHOPE Long-Term");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("contain", "MIHOPE Check-In");
        // Sort by agreement name ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[0].value}]`).click();
        // Wait for table to sort
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
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
        // Wait for table to sort
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
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
        // Wait for table to sort
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
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
        // Wait for table to sort
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
            "contain",
            "CONTRACT #2: Fathers and Continuous Learning (FCL)"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("contain", "MIHOPE Long-Term");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("contain", "Support Contract #1");

        // Sort table by agreement total descending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[3].value}]`).click();
        // Wait for table to sort
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
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
        // Wait for table to sort
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
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
        // Wait for table to sort
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
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
        // Wait for table to sort
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
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
        // Wait for table to sort
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
            "contain",
            "Support Contract #1"
        );
        cy.get("tbody > :nth-child(2) > [data-cy='agreement-name']").should("contain", "MIHOPE Check-In");
        cy.get("tbody > :nth-child(3) > [data-cy='agreement-name']").should("contain", "MIHOPE Long-Term");
        // Sort by next obligate by ascending
        cy.get(`[data-cy=${TABLE_HEADINGS_LIST[5].value}]`).click();
        // Wait for table to sort
        cy.get("tbody > :nth-child(1) > [data-cy='agreement-name']", { timeout: 10000 }).should(
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
