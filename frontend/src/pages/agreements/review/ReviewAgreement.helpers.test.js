import {
    anyBudgetLinesByStatus,
    getSelectedBudgetLines,
    getSelectedBudgetLinesCanAmounts,
    selectedBudgetLinesTotal,
    totalByCan,
    getTotalBySelectedCans,
    isBudgetLineInCurrentFiscalYear
} from "./ReviewAgreement.helpers";

describe("anyBudgetLinesByStatus", () => {
    const agreement = {
        budget_line_items: [
            { id: 1, status: "DRAFT" },
            { id: 2, status: "PLANNED" },
            { id: 3, status: "EXECUTING" }
        ]
    };

    it("returns true when there are budget line items with the given status", () => {
        const result = anyBudgetLinesByStatus(agreement, "DRAFT");
        expect(result).toBeTruthy();
    });

    it("returns false when there are no budget line items with the given status", () => {
        const result = anyBudgetLinesByStatus(agreement, "CLOSED");
        expect(result).toBeFalsy();
    });

    it("returns false when the agreement has no budget line items", () => {
        const agreementWithoutBudgetLines = {};
        const result = anyBudgetLinesByStatus(agreementWithoutBudgetLines, "DRAFT");
        expect(result).toBeFalsy();
    });
});
describe("getSelectedBudgetLines", () => {
    it("returns an empty array when no budget lines are selected", () => {
        const budgetLines = [
            { id: 1, selected: false },
            { id: 2, selected: false },
            { id: 3, selected: false }
        ];
        const result = getSelectedBudgetLines(budgetLines);
        expect(result).toEqual([]);
    });

    it("returns an array with selected budget lines", () => {
        const budgetLines = [
            { id: 1, selected: false },
            { id: 2, selected: true },
            { id: 3, selected: true }
        ];
        const result = getSelectedBudgetLines(budgetLines);
        expect(result).toEqual([
            { id: 2, selected: true },
            { id: 3, selected: true }
        ]);
    });

    it("throws an error when budgetLines is not an array", () => {
        expect(() => getSelectedBudgetLines("not an array")).toThrow();
    });

    it("throws an error when budgetLines contains an item without a 'selected' property", () => {
        const budgetLines = [{ id: 1 }, { id: 2, selected: true }];
        expect(() => getSelectedBudgetLines(budgetLines)).toThrow();
    });
});
describe("getSelectedBudgetLinesCanAmounts", () => {
    it("returns an empty array when no budget lines are selected", () => {
        const budgetLines = [
            { id: 1, selected: false, can_amount: 100 },
            { id: 2, selected: false, can_amount: 200 },
            { id: 3, selected: false, can_amount: 300 }
        ];
        const result = getSelectedBudgetLinesCanAmounts(budgetLines);
        expect(result).toEqual([]);
    });

    it("returns an array with selected budget lines' can_amounts", () => {
        const budgetLines = [
            { id: 1, selected: false, can_amount: 100 },
            { id: 2, selected: true, can_amount: 200 },
            { id: 3, selected: true, can_amount: 300 }
        ];
        const result = getSelectedBudgetLinesCanAmounts(budgetLines);
        expect(result).toEqual([200, 300]);
    });

    it("throws an error when budgetLines is not an array", () => {
        expect(() => getSelectedBudgetLinesCanAmounts("not an array")).toThrow();
    });

    it("throws an error when budgetLines contains an item without a 'can_amount' property", () => {
        const budgetLines = [{ id: 1 }, { id: 2, selected: true }];
        expect(() => getSelectedBudgetLinesCanAmounts(budgetLines)).toThrow();
    });
});
describe("selectedBudgetLinesTotal", () => {
    it("returns 0 when no budget lines are selected", () => {
        const budgetLines = [
            { id: 1, selected: false, amount: 100 },
            { id: 2, selected: false, amount: 200 },
            { id: 3, selected: false, amount: 300 }
        ];
        const result = selectedBudgetLinesTotal(budgetLines);
        expect(result).toEqual(0);
    });

    it("returns the total amount of selected budget lines", () => {
        const budgetLines = [
            { id: 1, selected: false, amount: 100 },
            { id: 2, selected: true, amount: 200 },
            { id: 3, selected: true, amount: 300 }
        ];
        const result = selectedBudgetLinesTotal(budgetLines);
        expect(result).toEqual(500);
    });

    it("throws an error when budgetLines is not an array", () => {
        expect(() => selectedBudgetLinesTotal("not an array")).toThrow();
    });

    it("throws an error when budgetLines contains an item without an 'amount' property", () => {
        const budgetLines = [{ id: 1 }, { id: 2, selected: true }];
        expect(() => selectedBudgetLinesTotal(budgetLines)).toThrow();
    });
});
describe("totalByCan", () => {
    it("returns an object with the total amount for each can", () => {
        const budgetLines = [
            { id: 1, can: { number: "123" }, amount: 100 },
            { id: 2, can: { number: "456" }, amount: 200 },
            { id: 3, can: { number: "123" }, amount: 300 }
        ];
        const result = budgetLines.reduce(totalByCan, {});
        expect(result).toEqual({ 123: 400, 456: 200 });
    });

    it("returns an empty object when given an empty array", () => {
        const budgetLines = [];
        const result = budgetLines.reduce(totalByCan, {});
        expect(result).toEqual({});
    });
});

describe("getTotalBySelectedCans", () => {
    it("returns an empty array when no budget lines are selected", () => {
        const budgetLines = [
            { id: 1, selected: false, can: { number: "123", active_period: "2021" }, amount: 100 },
            { id: 2, selected: false, can: { number: "456", active_period: "2022" }, amount: 200 },
            { id: 3, selected: false, can: { number: "123", active_period: "2021" }, amount: 300 }
        ];
        const result = getTotalBySelectedCans(budgetLines);
        expect(result).toEqual([]);
    });

    it("returns an array with selected cans' numbers, amounts and terms", () => {
        const budgetLines = [
            { id: 1, selected: true, can: { number: "123", active_period: "2021" }, amount: 100 },
            { id: 2, selected: true, can: { number: "456", active_period: "2022" }, amount: 200 },
            { id: 3, selected: true, can: { number: "123", active_period: "2021" }, amount: 300 }
        ];
        const result = getTotalBySelectedCans(budgetLines);
        expect(result).toEqual([
            { canNumber: "123", amount: 400, term: "2021" },
            { canNumber: "456", amount: 200, term: "2022" }
        ]);
    });

    it("throws an error when budgetLines is not an array", () => {
        expect(() => getTotalBySelectedCans("not an array")).toThrow();
    });

    it("throws an error when budgetLines contains an item without a 'can' property", () => {
        const budgetLines = [{ id: 1 }, { id: 2, selected: true }];
        expect(() => getTotalBySelectedCans(budgetLines)).toThrow();
    });
});

describe("isBudgetLineInCurrentFiscalYear", () => {
    it("returns true when the budget line's date_needed is in the current fiscal year", () => {
        const budgetLine = { date_needed: new Date() };
        const result = isBudgetLineInCurrentFiscalYear(budgetLine);
        expect(result).toBeTruthy();
    });

    it("returns false when the budget line's date_needed is not in the current fiscal year", () => {
        const budgetLine = { date_needed: new Date("2022-01-01") };
        const result = isBudgetLineInCurrentFiscalYear(budgetLine);
        expect(result).toBeFalsy();
    });

    it("returns false when the budget line's date_needed is undefined", () => {
        const budgetLine = {};
        const result = isBudgetLineInCurrentFiscalYear(budgetLine);
        expect(result).toBeFalsy();
    });
});
