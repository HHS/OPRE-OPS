/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

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
        cy.get('a[href="/cans/510"]').should("exist");
    });

    it("the available budget should match the table total", () => {
        cy.get("#fiscal-year-select").select("2021");
        // budget-summary-card-2021 should contain $ 30,200,000
        cy.get("[data-cy='budget-summary-card-2021']").contains("$ 30,200,000");

        const expectedValues = ["$0", "$200,000.00", "$10,000,000.00", "$10,000,000.00", "$10,000,000.00", "$0", "$0", "$0"];

        cy.get("tbody tr").each(($row, index) => {
            cy.wrap($row)
                .find("td")
                .eq(6) // Adjust index to the correct column containing the budget amount
                .invoke("text")
                .then((text) => {
                    const cleanedText = text.trim(); // Remove extra spaces
                    expect(cleanedText).to.equal(expectedValues[index]);
                });
        });
    });

    it("clicking on a CAN takes you to the detail page", () => {
        // beforeEach has ran...
        const canNumber = "G99XXX4";

        cy.contains(canNumber).click();

        cy.url().should("include", "/cans/510");
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
        cy.wait(500);
        cy.get("tbody").find("tr").should("have.length.above", 0);

        // switch fiscal year to 2023
        cy.get("#fiscal-year-select").select("2023");
        cy.wait(500);
        cy.get("li").should("have.class", "usa-pagination__item").contains("2").click();

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
        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("tbody").contains("G99XXX3").should("exist");
        cy.get("tbody").contains("G1183CE").should("exist");
        cy.get("tbody").contains("G996400").should("exist");
    });
});

describe("CAN List Filtering", () => {
    it("should correctly filter all cans or my cans", () => {
        cy.get("tbody").children().should("have.length.greaterThan", 2);
        // TODO: reinstate once My CANs is functional
        // cy.visit("/cans/?filter=my-cans");
        cy.get("#fiscal-year-select").select("2044");
        // table should not exist and contain one row
        cy.get("tbody").children().should("have.length.above", 0);
        // table row should contain G996400
        cy.get("tbody").contains("G996400").should("exist");
    });

    it("the filter button works as expected", () => {
        cy.get("button").contains("Filter").click();
        // set a number of filters
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.get(".can-active-period-combobox__control")
            .click()
            .get(".can-active-period-combobox__menu")
            .find(".can-active-period-combobox__option")
            .first()
            .click();
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.get(".can-transfer-combobox__control")
            .click()
            .get(".can-transfer-combobox__menu")
            .find(".can-transfer-combobox__option")
            .first()
            .click();
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.get(".can-portfolio-combobox__control")
            .click()
            .get(".can-portfolio-combobox__menu")
            .find(".can-portfolio-combobox__option")
            .first()
            .click();
        // move range slider via mouse event
        cy.get(".sc-blHHSb").within(() => {
            // Get the initial values
            cy.get(".thumb.thumb-0").invoke("attr", "aria-valuenow").as("initialMin");
            cy.get(".thumb.thumb-1").invoke("attr", "aria-valuenow").as("initialMax");

            cy.get(".thumb.thumb-0").then(($el) => {
                const width = $el.width();
                const height = $el.height();
                cy.wrap($el)
                    .trigger("mousedown", { which: 1, pageX: 0, pageY: height / 2 })
                    .trigger("mousemove", { which: 1, pageX: width * 0.2, pageY: height / 2 })
                    .trigger("mouseup");
            });

            cy.get(".thumb.thumb-1").then(($el) => {
                const width = $el.width();
                const height = $el.height();
                cy.wrap($el)
                    .trigger("mousedown", { which: 1, pageX: width, pageY: height / 2 })
                    .trigger("mousemove", { which: 1, pageX: width * 0.8, pageY: height / 2 })
                    .trigger("mouseup");
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

        cy.get("span").contains("1 Year").should("exist");
        cy.get("span").contains("Direct").should("exist");
        cy.get("span").contains("Child Care (CC)").should("exist");
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

    it("fiscal year filtering with FY budgets equalling 5,000,000", () => {
        cy.get("button").contains("Filter").click();

        cy.get(".sc-blHHSb").within(() => {
            cy.get(".thumb.thumb-1").invoke("attr", "aria-valuenow").as("initialMax");

            cy.get(".thumb.thumb-1").then(($el) => {
                const width = $el.width();
                const height = $el.height();
                cy.wrap($el)
                    .trigger("mousedown", { which: 1, pageX: width, pageY: height / 2 })
                    .trigger("mousemove", { which: 1, pageX: width * -100, pageY: height / 2 })
                    .trigger("mouseup");
            });
        });

        cy.get("button").contains("Apply").click();

        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("[data-cy='line-graph-with-legend-card']").contains("500,000.00");
    });

    it("fiscal year filtering with FY budgets over 5,000,000", () => {
        cy.get("button").contains("Filter").click();

        cy.get(".sc-blHHSb").within(() => {
            cy.get(".thumb.thumb-0").invoke("attr", "aria-valuenow").as("initialMin");

            cy.get(".thumb.thumb-0").then(($el) => {
                const width = $el.width();
                const height = $el.height();
                cy.wrap($el)
                    .trigger("mousedown", { which: 1, pageX: 0, pageY: height / 2 })
                    .trigger("mousemove", { which: 1, pageX: 150, pageY: height / 2 })
                    .trigger("mouseup");
            });
        });

        cy.get("button").contains("Apply").click();

        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("[data-cy='line-graph-with-legend-card']").contains("78,200,000.00");
    });

    it("fiscal year filtering with FY budgets under 1,450,000", () => {
        cy.get("button").contains("Filter").click();

        cy.get(".sc-blHHSb").within(() => {
            cy.get(".thumb.thumb-1").invoke("attr", "aria-valuenow").as("initialMax");

            cy.get(".thumb.thumb-1").then(($el) => {
                const width = $el.width();
                const height = $el.height();
                cy.wrap($el)
                    .trigger("mousedown", { which: 1, pageX: 0, pageY: height / 2 })
                    .trigger("mousemove", { which: 1, pageX: -300, pageY: height / 2 })
                    .trigger("mouseup");
            });
        });

        cy.get("button").contains("Apply").click();

        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("[data-cy='line-graph-with-legend-card']").contains("$ 8,200,000.00");
    });
    it("multi-delete should not break the app", () => {
        cy.get("button").contains("Filter").click();
        // eslint-disable-next-line cypress/unsafe-to-chain-command
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
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.get(".can-active-period-combobox__control").click();
        cy.get(".can-active-period-combobox__clear-indicator").click();
        // click the button that has text Apply
        cy.get("button").contains("Apply").click();
        cy.get("tbody").find("tr").should("have.length.above", 0);

        // now do the same for the second filter
        cy.get("button").contains("Filter").click();
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.get(".can-transfer-combobox__control")
            .click()
            .get(".can-transfer-combobox__menu")
            .find(".can-transfer-combobox__option")
            .first()
            .click();
        cy.get("button").contains("Apply").click();
        cy.get("tbody").find("tr").should("have.length.above", 0);
        cy.get("button").contains("Filter").click();
        cy.get(".can-transfer-combobox__control").click();
        cy.get(".can-transfer-combobox__clear-indicator").click();
        // click the button that has text Apply
        cy.get("button").contains("Apply").click();
        cy.get("tbody").find("tr").should("have.length.above", 0);

        // now do the same for the third filter
        cy.get("button").contains("Filter").click();
        // eslint-disable-next-line cypress/unsafe-to-chain-command
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
        // eslint-disable-next-line cypress/unsafe-to-chain-command
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
