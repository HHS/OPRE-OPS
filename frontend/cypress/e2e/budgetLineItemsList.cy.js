/// <reference types="cypress" />
import { terminalLog, testLogin } from "./utils";

const ALL_BLI_TOTAL_2044 = "1,743,043,573.00";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/budget-lines");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("loads", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get("h1").should("have.text", "Budget Lines");
    cy.get("h2").should("have.text", "All Budget Lines");
    cy.get('[data-cy="bl-total-summary-card"]').should("exist");
    cy.get('[data-cy="bli-status-summary-card"]').should("exist");
    cy.get(".usa-table").should("exist");
});

it("pagination on the bli table works as expected", () => {
    cy.get("#fiscal-year-select").select("2044");
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

    // go back to the first page
    cy.get("li").should("have.class", "usa-pagination__item").contains("1").click();
    cy.get("button").should("have.class", "usa-current").contains("1");
});

// Opens the filter panel, fills every fieldset (comboboxes + budget range slider), and applies.
// Shared by the "applying filters" and "resetting filters" tests below so resetting still
// exercises a real apply-then-reset journey without duplicating ~40 lines of setup.
const applyAllFilters = () => {
    cy.get("button").contains("Filter").click();

    // The afterEach hook only checks the DOM after the modal is closed again, so
    // check it here too, while it's actually open.
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);

    // set a number of filters

    cy.get(".fiscal-year-combobox__control")
        .click()
        .get(".fiscal-year-combobox__menu")
        .find(".fiscal-year-combobox__option")
        .contains("2043")
        .click();
    cy.get(".portfolios-combobox__control")
        .click()
        .get(".portfolios-combobox__menu")
        .find(".portfolios-combobox__option")
        .contains("Child Welfare Research")
        .click();
    cy.get(".agreement-type-combobox__control")
        .click()
        .get(".agreement-type-combobox__menu")
        .find(".agreement-type-combobox__option")
        .contains("Contract")
        .click();
    cy.get(".agreement-name-combobox__control")
        .click()
        .get(".agreement-name-combobox__menu")
        .find(".agreement-name-combobox__option")
        .contains("Contract #1: African American Child and Family Research Center")
        .click();
    cy.get(".can-active-period-combobox__control")
        .click()
        .get(".can-active-period-combobox__menu")
        .find(".can-active-period-combobox__option")
        .contains("5 Year")
        .click();

    // Capture into plain JS variables, not a Cypress .as() alias — aliasing a value derived
    // from a DOM query (cy.get(...).invoke("attr", ...)) does NOT freeze it: Cypress re-runs
    // the whole chain against the live DOM every time the alias is read later, so comparing
    // "@initialMin" against a value read after the drag always compares the post-drag value
    // to itself.
    let initialMin;
    let initialMax;
    cy.get("[data-testid='budget-range-slider']").within(() => {
        cy.get(".thumb.thumb-0")
            .invoke("attr", "aria-valuenow")
            .then((v) => {
                initialMin = v;
            });
        cy.get(".thumb.thumb-1")
            .invoke("attr", "aria-valuenow")
            .then((v) => {
                initialMax = v;
            });
    });

    // The drag distance must be computed against the TRACK's width, not a thumb's own ~30px
    // width — using the thumb's width here previously made every drag move by only ~1-2%
    // regardless of what distance the math intended, since react-slider maps pixel delta
    // through the track's actual DOM width to compute the percentage change. Kept to a small
    // (~2%) nudge rather than a large swing: this spec combines the range filter with 5 other
    // hardcoded filters (a specific agreement, FY, portfolio, etc.), and a large cut against the
    // slider's always-global min/max bounds risks filtering that exact combination to zero rows.
    cy.get("[data-testid='budget-range-slider']")
        .invoke("width")
        .then((trackWidth) => {
            cy.get("[data-testid='budget-range-slider']").within(() => {
                cy.get(".thumb.thumb-0").then(($el) => {
                    const height = $el.height();
                    // Split the chain to avoid unsafe subject usage
                    cy.wrap($el).trigger("mousedown", { which: 1, pageX: 0, pageY: (height || 0) / 2 });
                    cy.wrap($el).trigger("mousemove", {
                        which: 1,
                        pageX: trackWidth * 0.02,
                        pageY: (height || 0) / 2
                    });
                    cy.wrap($el).trigger("mouseup");
                });

                cy.get(".thumb.thumb-1").then(($el) => {
                    const height = $el.height();
                    // Split the chain to avoid unsafe subject usage
                    cy.wrap($el).trigger("mousedown", { which: 1, pageX: trackWidth, pageY: (height || 0) / 2 });
                    cy.wrap($el).trigger("mousemove", {
                        which: 1,
                        pageX: trackWidth * 0.98,
                        pageY: (height || 0) / 2
                    });
                    cy.wrap($el).trigger("mouseup");
                });

                // Confirm the drag actually moved each thumb in the right direction, not just
                // dispatched no-op events.
                cy.get(".thumb.thumb-0")
                    .invoke("attr", "aria-valuenow")
                    .should((newMin) => {
                        expect(Number(newMin)).to.be.greaterThan(Number(initialMin));
                    });
                cy.get(".thumb.thumb-1")
                    .invoke("attr", "aria-valuenow")
                    .should((newMax) => {
                        expect(Number(newMax)).to.be.lessThan(Number(initialMax));
                    });
            });
        });

    // All fieldsets filled in and the slider thumbs moved — check this populated,
    // pre-Apply state too, not just the modal's untouched opening state above.
    cy.checkA11y(null, null, terminalLog);

    // click the button that has text Apply
    cy.get("button").contains("Apply").click();
};

it("applying filters sets tags, values, and announces the result", () => {
    applyAllFilters();

    // check that the correct tags are displayed
    cy.get("div").contains("Filters Applied:").should("exist");
    cy.get("button[id='filter-tag-fiscalYears-0']").should("exist");
    cy.get("button[id='filter-tag-portfolios-1']").should("exist");
    cy.get("button[id='filter-tag-budgetRange-2']").should("exist");
    cy.get("button[id='filter-tag-agreementTypes-3']").should("exist");
    cy.get("button[id='filter-tag-agreementTitles-4']").should("exist");
    cy.get("button[id='filter-tag-canActivePeriods-5']").should("exist");

    cy.get("div").contains("FY 2043").should("exist");
    cy.get("div").contains("Child Welfare Research").should("exist");
    cy.get("div").contains("Contract").should("exist");
    cy.get("div").contains("Contract #1: African American Child and Family Research Center").should("exist");
    cy.get("div").contains("5 Year").should("exist");

    // check that the table is filtered correctly
    cy.get("div[id='budget-line-items-table-zero-results']").should("not.exist");
    cy.get('[data-cy="filter-results-announcement"]', { timeout: 10000 })
        .invoke("text")
        .should("match", /^Filters applied\. \d+ budget lines?\.$/);
});

it("resetting filters clears tags and announces the result", () => {
    applyAllFilters();

    // reset
    cy.get("button").contains("Filter").click();
    cy.get("button").contains("Reset").click();
    cy.get("button").contains("Apply").click();

    // check that the correct tags are displayed
    cy.get("div").contains("Filters Applied:").should("not.exist");
    cy.get("button[id='filter-tag-fiscalYears-0']").should("not.exist");
    cy.get("button[id='filter-tag-portfolios-1']").should("not.exist");
    cy.get("button[id='filter-tag-budgetRange-2']").should("not.exist");
    cy.get("button[id='filter-tag-agreementTypes-3']").should("not.exist");
    cy.get("button[id='filter-tag-agreementTitles-4']").should("not.exist");
    cy.get("button[id='filter-tag-canActivePeriods-5']").should("not.exist");
    cy.get('[data-cy="filter-results-announcement"]', { timeout: 10000 })
        .invoke("text")
        .should("match", /^Filters cleared\. \d+ budget lines?\.$/);
});

it("filters budget lines by a person in Division & Staffing and clears it from the tag", () => {
    const announcedCount = (pattern) =>
        cy
            .get('[data-cy="filter-results-announcement"]', { timeout: 10000 })
            .invoke("text")
            .should("match", pattern)
            .then((text) => Number(text.match(pattern)[1]));

    cy.get("button").contains("Filter").click();

    // Each division is followed by its people, so the second option is the first division's first person.
    cy.get(".division-staffing-combobox__control").click();

    // The menu is open and its option list rendered — another state the
    // afterEach-only check never sees.
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);

    cy.get(".division-staffing-combobox__option")
        .eq(1)
        .invoke("text")
        .then((label) => {
            cy.get(".division-staffing-combobox__option").eq(1).click();
            cy.get("button").contains("Apply").click();

            cy.get("div").contains("Filters Applied:").should("exist");
            cy.get(`button[aria-label="Remove ${label} filter"]`).should("exist");
            cy.get("div[id='budget-line-items-table-zero-results']").should("not.exist");
            cy.get("tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);

            announcedCount(/^Filters applied\. (\d+) budget lines?\.$/).then((filteredCount) => {
                // Removing the tag returns the page to all budget lines, which must be more than one person's.
                cy.get(`button[aria-label="Remove ${label} filter"]`).click();
                cy.get("div").contains("Filters Applied:").should("not.exist");
                announcedCount(/^Filters cleared\. (\d+) budget lines?\.$/).should("be.greaterThan", filteredCount);
            });
        });
});

it("filter button does not reset fiscal year dropdown when fiscal year dropdown is changed from current FY", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get("button").contains("Filter").click();

    // set a number of filters

    cy.get(".bli-status-combobox__control")
        .click()
        .get(".bli-status-combobox__menu")
        .find(".bli-status-combobox__option")
        .contains("Draft")
        .click();

    // click the button that has text Apply
    cy.get("button").contains("Apply").click();

    // Check that the same year is still provided
    cy.get("#fiscal-year-select").should("have.value", "2044");
});

it("click on chevron down should open row and see budgetline data", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get("tbody").find('[data-cy="expanded-data"]').should("not.exist");
    cy.get("tbody").find("tr").first().find('[data-cy="expand-row"]').click();
    cy.get("tbody").find('[data-cy="expanded-data"]').as("expandedRow").should("exist");
    cy.get("@expandedRow").contains("Created by");
    cy.get("@expandedRow").contains("Description");
    cy.get("@expandedRow").contains("Procurement Shop");
    cy.get("@expandedRow").contains("Subtotal");
    cy.get("@expandedRow").contains("Fees");
    cy.get("@expandedRow").contains("Project");
    cy.get("@expandedRow").contains("Award Type");
    cy.get("@expandedRow").contains("Research Type");
    cy.get("@expandedRow").contains("Vendor");
});

it("click on agreement name and check if its routed to the correct page", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get("tbody tr").first().find("a[href*='/agreements/']").first().click();
    cy.url().should("match", /\/agreements\/\d+/);
});

// TODO: fix this test - this takes too long to run and is indicative of a performance issue
it.skip("Should filter all budgetlines vs my budget lines", () => {
    cy.get('[data-cy="bl-total-summary-card"]').as("total-bli-card").should("exist");
    cy.get("@total-bli-card").contains(ALL_BLI_TOTAL_2044);
    cy.get('[data-cy="tab-selected"]').as("tab-selected").should("exist");
    cy.get('[data-cy="tab-not-selected"]').as("tab-selected").should("exist");
    cy.get('[data-cy="tab-not-selected"]').click();
    cy.get("@total-bli-card").contains(ALL_BLI_TOTAL_2044);
});

it("Should allow the user to export table", () => {
    cy.get("#fiscal-year-select").select("2044");
    cy.get('[data-cy="budget-line-export"]').should("exist");

    cy.get("#fiscal-year-select").select("2028");
    cy.get('[data-cy="budget-line-export"]').should("not.exist");
});
