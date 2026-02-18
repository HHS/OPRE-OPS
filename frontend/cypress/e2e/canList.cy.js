/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

const validateBudgetColumn = (expectedValues, columnIndex = 6) => {
    cy.get("tbody tr").each(($row, index) => {
        cy.wrap($row)
            .find("td")
            .eq(columnIndex)
            .invoke("text")
            .then((text) => {
                const cleanedText = text.trim();
                expect(cleanedText).to.equal(expectedValues[index]);
            });
    });
};

beforeEach(() => {
    testLogin("division-director");
    cy.visit("/cans").wait(2000);
    cy.get("#fiscal-year-select").select("2023");
    cy.get("button").contains("Filter").click();
    cy.get("button").contains("Reset").click();
    cy.get("button").contains("Apply").click();
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

// TODO: Change table item check to 25 once in production
const defaultTableRowsPerPage = 10;

describe("CAN List", () => {
    it("loads", () => {
        // beforeEach has ran...
        cy.get("h1").should("have.text", "CANs");
        cy.get("tbody").find("tr").should("have.length", defaultTableRowsPerPage);
        cy.get("[data-cy='line-graph-with-legend-card']").contains("$ 78,200,000");
        cy.get('a[href="/cans/503"]').should("exist");
    });

    it("the available budget should match the table total", () => {
        cy.get("#fiscal-year-select").select("2021");
        // budget-summary-card-2021 should contain $ 30,200,000
        cy.get("[data-cy='budget-summary-card-2021']").contains("$ 30,200,000");

        const expectedValues = ["$10,000,000.00", "$10,000,000.00", "$10,000,000.00", "$0", "$200,000.00"];
        validateBudgetColumn(expectedValues);
    });

    it("clicking on a CAN takes you to the detail page", () => {
        // beforeEach has ran...
        const canNumber = "G990136";

        cy.contains(canNumber).click();

        cy.url().should("include", "/cans/503");
        cy.get("h1").should("contain", canNumber);
    });

    it("pagination on the CAN table works as expected", () => {
        cy.get("ul").should("have.class", "usa-pagination__list");
        cy.get("li").should("have.class", "usa-pagination__item").contains("1");
        cy.get("button").should("have.class", "usa-current").contains("1");
        cy.get("li").should("have.class", "usa-pagination__item").contains("2");
        cy.get("li").should("have.class", "usa-pagination__item").contains("Next");
        cy.get("tbody").find("tr").should("have.length", 10);
        cy.get("li")
            .should("have.class", "usa-pagination__item")
            .contains("Previous")
            .find("svg")
            .should("have.attr", "aria-hidden", "true");

        // go to the second page
        cy.get("li").should("have.class", "usa-pagination__item").contains("2").click();
        cy.get("button").should("have.class", "usa-current").contains("2");
        cy.get("li").should("have.class", "usa-pagination__item").contains("Previous");
        cy.get("li")
            .should("have.class", "usa-pagination__item")
            .contains("Next")
            .find("svg")
            .should("have.attr", "aria-hidden", "true");

        // switch fiscal year to 2025
        cy.get("#fiscal-year-select").select("2025");
        // Wait for data to reload
        cy.get("tbody", { timeout: 10000 }).find("tr").should("have.length.above", 0);

        // switch fiscal year to 2023
        cy.get("#fiscal-year-select").select("2023");
        // Wait for pagination to reload
        cy.get("li.usa-pagination__item", { timeout: 10000 }).contains("2").should("be.visible").click();

        // go back to the first page
        cy.get("li").should("have.class", "usa-pagination__item").contains("1").click();
        cy.get("button").should("have.class", "usa-current").contains("1");
    });

    it("should display the summary cards", () => {
        cy.get("#fiscal-year-select").select("2023");
        cy.get("[data-cy='budget-summary-card-2023']").should("exist");
        cy.get("[data-cy='budget-summary-card-2023']").contains("FY 2023 CANs Available Budget");
        cy.get("[data-cy='line-graph-with-legend-card']").should("exist");
        cy.get("[data-cy='line-graph-with-legend-card']").contains("FY 2023 CANs Total Budget");
    });

    it("test cans with no funding budgets", () => {
        cy.get("#fiscal-year-select").select("2044");
        cy.get("tbody").find("tr").should("have.length", 1);
        cy.get("tbody").contains("G99AB14").should("exist");
    });
});

describe("CAN List Filtering", () => {
    // TODO: reinstate once My CANs is functional
    it.skip("should correctly filter all cans or my cans", () => {
        cy.get("tbody").children().should("have.length.greaterThan", 2);
        // cy.visit("/cans/?filter=my-cans");
        cy.get("#fiscal-year-select").select("2044");
        // table should not exist and contain one row
        cy.get("tbody").children().should("have.length.above", 0);
        // table row should contain G99AB14
        cy.get("tbody").contains("G99AB14").should("exist");
    });

    it("the filter button works as expected", () => {
        cy.get("button").contains("Filter").click();
        // set a number of filters
        cy.get(".can-active-period-combobox__control")
            .click()
            .get(".can-active-period-combobox__menu")
            .find(".can-active-period-combobox__option")
            .first()
            .click();
        cy.get(".can-transfer-combobox__control")
            .click()
            .get(".can-transfer-combobox__menu")
            .find(".can-transfer-combobox__option")
            .first()
            .click();
        cy.get(".can-portfolio-combobox__control")
            .click()
            .get(".can-portfolio-combobox__menu")
            .find(".can-portfolio-combobox__option")
            .first()
            .click();
        cy.get(".can-number-combobox__control")
            .click()
            .get(".can-number-combobox__menu")
            .find(".can-number-combobox__option")
            .first()
            .click();
        // move range slider via mouse event
        cy.get("[data-testid='can-fy-budget-range-slider']").within(() => {
            // Get the initial values
            cy.get(".thumb.thumb-0").invoke("attr", "aria-valuenow").as("initialMin");
            cy.get(".thumb.thumb-1").invoke("attr", "aria-valuenow").as("initialMax");

            cy.get(".thumb.thumb-0").then(($el) => {
                const width = $el.width();
                const height = $el.height();
                // Split the chain to avoid unsafe subject usage
                cy.wrap($el).trigger("mousedown", { which: 1, pageX: 0, pageY: (height || 0) / 2 });
                cy.wrap($el).trigger("mousemove", { which: 1, pageX: (width || 0) * 0.2, pageY: (height || 0) / 2 });
                cy.wrap($el).trigger("mouseup");
            });

            cy.get(".thumb.thumb-1").then(($el) => {
                const width = $el.width();
                const height = $el.height();
                // Split the chain to avoid unsafe subject usage
                cy.wrap($el).trigger("mousedown", { which: 1, pageX: width || 0, pageY: (height || 0) / 2 });
                cy.wrap($el).trigger("mousemove", { which: 1, pageX: (width || 0) * 0.8, pageY: (height || 0) / 2 });
                cy.wrap($el).trigger("mouseup");
            });
        });

        // click the button that has text Apply
        cy.get("button").contains("Apply").click();

        // check that the correct tags are displayed
        cy.get("div").contains("Filters Applied:").should("exist");
        cy.get("svg[id='filter-tag-activePeriod']").should("exist");
        cy.get("svg[id='filter-tag-transfer']").should("exist");
        cy.get("svg[id='filter-tag-portfolio']").should("exist");
        cy.get("svg[id='filter-tag-budget']").should("exist");

        cy.get("span").contains("1 Year CAN").should("exist");
        cy.get("span").contains("Cost Share").should("exist");
        cy.get("span").contains("Adolescent Development Research (ADR)").should("exist");
        cy.get("span").contains("G1183CE").should("exist");
        cy.get("span").contains("$690,000 to $9,810,000").should("exist");

        // No CANs found
        cy.get("tbody").should("not.exist");
        cy.get("p.text-center").contains("No CANs found").should("exist");
        // reset
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();

        cy.get("div").contains("Filters Applied:").should("not.exist");
        cy.get("svg[id='filter-tag-activePeriod']").should("not.exist");
        cy.get("svg[id='filter-tag-transfer']").should("not.exist");
        cy.get("svg[id='filter-tag-portfolio']").should("not.exist");
        cy.get("svg[id='filter-tag-budget']").should("not.exist");

        cy.get("tbody").find("tr").should("have.length.greaterThan", 3);
    });

    // The three tests below are failing unpredictably in github. Skipping for now.
    it.skip("fiscal year filtering with FY budgets equalling 5,000,000", () => {
        cy.get("button").contains("Filter").click();

        cy.get(".sc-blHHSb").within(() => {
            cy.get(".thumb.thumb-1").invoke("attr", "aria-valuenow").as("initialMax");

            cy.get(".thumb.thumb-1").then(($el) => {
                const width = $el.width();
                const height = $el.height();
                // Split the chain to avoid unsafe subject usage
                cy.wrap($el).trigger("mousedown", { which: 1, pageX: width || 0, pageY: (height || 0) / 2 });
                cy.wrap($el).trigger("mousemove", { which: 1, pageX: (width || 0) * -100, pageY: (height || 0) / 2 });
                cy.wrap($el).trigger("mouseup");
            });
        });

        cy.get("button").contains("Apply").click();

        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("[data-cy='line-graph-with-legend-card']").contains("500,000.00");
    });

    it.skip("fiscal year filtering with FY budgets over 5,000,000", () => {
        cy.get("button").contains("Filter").click();

        cy.get(".sc-blHHSb").within(() => {
            cy.get(".thumb.thumb-0").invoke("attr", "aria-valuenow").as("initialMin");

            cy.get(".thumb.thumb-0").then(($el) => {
                const height = $el.height();
                // Split the chain to avoid unsafe subject usage
                cy.wrap($el).trigger("mousedown", { which: 1, pageX: 0, pageY: (height || 0) / 2 });
                cy.wrap($el).trigger("mousemove", { which: 1, pageX: 150, pageY: (height || 0) / 2 });
                cy.wrap($el).trigger("mouseup");
            });
        });

        cy.get("button").contains("Apply").click();

        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("[data-cy='line-graph-with-legend-card']").contains("78,200,000.00");
    });

    it.skip("fiscal year filtering with FY budgets under 1,450,000", () => {
        cy.get("button").contains("Filter").click();

        cy.get(".sc-blHHSb").within(() => {
            cy.get(".thumb.thumb-1").invoke("attr", "aria-valuenow").as("initialMax");

            cy.get(".thumb.thumb-1").then(($el) => {
                const height = $el.height();
                // Split the chain to avoid unsafe subject usage
                cy.wrap($el).trigger("mousedown", { which: 1, pageX: 0, pageY: (height || 0) / 2 });
                cy.wrap($el).trigger("mousemove", { which: 1, pageX: -300, pageY: (height || 0) / 2 });
                cy.wrap($el).trigger("mouseup");
            });
        });

        cy.get("button").contains("Apply").click();

        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("[data-cy='line-graph-with-legend-card']").contains("$ 8,200,000.00");
    });

    it.skip("multi-delete should not break the app", () => {
        cy.get("button").contains("Filter").click();
        cy.get(".can-active-period-combobox__control")
            .click()
            .get(".can-active-period-combobox__menu")
            .find(".can-active-period-combobox__option")
            .first()
            .click();
        // click the button that has text Apply
        cy.get("button").contains("Apply").click();
        //table should have 8 rows
        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("button").contains("Filter").click();
        // click on the can-active-period-combobox__clear-indicator

        cy.get(".can-active-period-combobox__control").click();
        cy.get(".can-active-period-combobox__clear-indicator").click();
        // click the button that has text Apply
        cy.get("button").contains("Apply").click();
        cy.get("tbody").find("tr").should("have.length.above", 0);

        // now do the same for the second filter
        cy.get("button").contains("Filter").click();
        cy.get(".can-transfer-combobox__control")
            .click()
            .get(".can-transfer-combobox__menu")
            .find(".can-transfer-combobox__option")
            .first()
            .click();
        cy.get("button").contains("Apply").click();
        // transfer filter should work and return results (DIRECT has 3 CANs in test data)
        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("button").contains("Filter").click();
        cy.get(".can-transfer-combobox__control").click();
        cy.get(".can-transfer-combobox__clear-indicator").click();
        // click the button that has text Apply
        cy.get("button").contains("Apply").click();
        cy.get("tbody").find("tr").should("have.length.above", 0);

        // now do the same for the third filter
        cy.get("button").contains("Filter").click();
        cy.get(".can-portfolio-combobox__control")
            .click()
            .get(".can-portfolio-combobox__menu")
            .find(".can-portfolio-combobox__option")
            .first()
            .click();
        cy.get("button").contains("Apply").click();
        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("button").contains("Filter").click();
        cy.get(".can-portfolio-combobox__control");
        cy.get(".can-portfolio-combobox__clear-indicator").click();
        // click the button that has text Apply
        cy.get("button").contains("Apply").click();
        cy.get("tbody").find("tr").should("have.length", 10);
    });

    it("pagination should work when filtering on page 2", () => {
        // go to the second page
        cy.get("li").should("have.class", "usa-pagination__item").contains("2").click();
        // table should have more than 3 rows
        cy.get("tbody").find("tr").should("have.length.greaterThan", 3);
        cy.get("button").contains("Filter").click();
        // set a number of filters
        cy.get(".can-active-period-combobox__control")
            .click()
            .get(".can-active-period-combobox__menu")
            .find(".can-active-period-combobox__option")
            .first()
            .click();
        cy.get("button").contains("Apply").click();
        // 1st page should have more than 3 rows
        cy.get("tbody").find("tr").should("have.length.greaterThan", 3);
    });
});

// All CAN List and CANs from the Portfolio Funding tabs should match
describe("CAN List and 'Portfolio Budget by CAN'", () => {
    it("should display matching CANs and budgets across list and portfolio views", () => {
        const selectedPortfolioOptionIndex = 1; // Child Care Research (CC)

        const expectedCANs = [
            { id: "G99MV23", amount: "$1,000,000.00" },
            { id: "G99MV24", amount: "$0" },
            { id: "G99MVT3", amount: "$1,000,000.00" },
            { id: "G99SHARED", amount: "$500,000.00" },
            { id: "G99XXX8", amount: "$1,140,000.00" }
        ];

        // Filter by portfolio in the CAN list
        cy.get("button").contains("Filter").click();
        cy.get(".can-portfolio-combobox__control")
            .click()
            .get(".can-portfolio-combobox__menu")
            .find(".can-portfolio-combobox__option")
            .eq(selectedPortfolioOptionIndex)
            .click();
        cy.get("button").contains("Apply").click();

        cy.get("tbody").find("tr").should("have.length", expectedCANs.length);

        // Validate budget values and CAN IDs in table
        validateBudgetColumn(expectedCANs.map((c) => c.amount));
        expectedCANs.forEach(({ id }) => {
            cy.get("tbody").contains(id).should("exist");
        });

        // Navigate to portfolio funding page and validate
        cy.visit("/portfolios/3/funding");
        cy.get("#fiscal-year-select").select("2023");

        expectedCANs.forEach(({ id, amount }) => {
            cy.get(`[data-cy="can-card-${id}"]`)
                .should("contain", id)
                .should("contain", amount === "$0" ? "TBD" : amount);
        });
    });
});
