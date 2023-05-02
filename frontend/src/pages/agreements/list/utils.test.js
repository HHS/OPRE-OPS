import sortAgreements from "./utils";

describe("test sort agreements", () => {
    it("sorts correctly", () => {
        const minBudgetLineItems = [
            {
                date_needed: new Date(2000, 1, 1),
            },
            {
                date_needed: new Date(2001, 1, 1),
            },
            {
                date_needed: new Date(2002, 1, 1),
            },
        ];
        const maxBudgetLineItems = [
            {
                date_needed: new Date(2010, 1, 1),
            },
            {
                date_needed: new Date(2011, 1, 1),
            },
            {
                date_needed: new Date(2012, 1, 1),
            },
        ];
        const allNullBudgetLineItems = [
            {
                date_needed: null,
            },
            {
                date_needed: null,
            },
            {
                date_needed: null,
            },
        ];
        const someNullBudgetLineItems = [
            {
                date_needed: new Date(1999, 1, 1),
            },
            {
                date_needed: null,
            },
            {
                date_needed: null,
            },
        ];
        const testAgreements = [
            {
                budget_line_items: minBudgetLineItems,
            },
            {
                budget_line_items: maxBudgetLineItems,
            },
            {
                budget_line_items: allNullBudgetLineItems,
            },
            {
                budget_line_items: someNullBudgetLineItems,
            },
        ];
        const result = sortAgreements(testAgreements);
        expect(result[0]["budget_line_items"]).toStrictEqual(someNullBudgetLineItems);
        expect(result[1]["budget_line_items"]).toStrictEqual(minBudgetLineItems);
        expect(result[2]["budget_line_items"]).toStrictEqual(maxBudgetLineItems);
        expect(result[3]["budget_line_items"]).toStrictEqual(allNullBudgetLineItems);
    });

    it("sorts correctly 2", () => {
        const maxBudgetLineItems1 = [
            {
                date_needed: "2000-01-01",
            },
            {
                date_needed: "2001-01-01",
            },
            {
                date_needed: "2002-01-01",
            },
        ];
        const maxBudgetLineItems2 = [
            {
                date_needed: "2010-01-01",
            },
            {
                date_needed: "2011-01-01",
            },
            {
                date_needed: "2012-01-01",
            },
        ];
        const minBudgetLineItems = [
            {
                date_needed: "1999-01-01",
            },
        ];
        const allNullBudgetLineItems = [
            {
                date_needed: null,
            },
        ];
        const testAgreements = [
            {
                budget_line_items: maxBudgetLineItems1,
            },
            {
                budget_line_items: maxBudgetLineItems2,
            },
            {
                budget_line_items: allNullBudgetLineItems,
            },
            {
                budget_line_items: minBudgetLineItems,
            },
        ];
        const result = sortAgreements(testAgreements);
        expect(result[0]["budget_line_items"]).toStrictEqual(minBudgetLineItems);
        expect(result[1]["budget_line_items"]).toStrictEqual(maxBudgetLineItems1);
        expect(result[2]["budget_line_items"]).toStrictEqual(maxBudgetLineItems2);
        expect(result[3]["budget_line_items"]).toStrictEqual(allNullBudgetLineItems);
    });
});
