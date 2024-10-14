import {
    findFundingBudgetBudgetByFiscalYear,
    findFundingBudgetFYByFiscalYear,
    formatObligateBy
} from "./CANTable.helpers";

describe("formatObligateBy", () => {
    test('returns "TBD" for undefined input', () => {
        expect(formatObligateBy(undefined)).toBe("TBD");
    });

    test('returns "TBD" for non-numeric input', () => {
        expect(formatObligateBy("not a number")).toBe("TBD");
    });

    test('returns "TBD" for NaN input', () => {
        expect(formatObligateBy(NaN)).toBe("TBD");
    });

    test("formats valid fiscal year correctly", () => {
        expect(formatObligateBy(2023)).toBe("09/30/22");
    });

    test("handles different fiscal years", () => {
        expect(formatObligateBy(2024)).toBe("09/30/23");
        expect(formatObligateBy(2025)).toBe("09/30/24");
    });
});

describe("findFundingBudgetFYByFiscalYear", () => {
    const mockCAN = {
        funding_budgets: [
            { fiscal_year: 2022, budget: 1000 },
            { fiscal_year: 2023, budget: 2000 },
            { fiscal_year: 2024, budget: 3000 }
        ]
    };

    test("returns 0 for undefined CAN", () => {
        expect(findFundingBudgetFYByFiscalYear(undefined, 2023)).toBe(0);
    });

    test("returns 0 for undefined fiscal year", () => {
        expect(findFundingBudgetFYByFiscalYear(mockCAN, undefined)).toBe(0);
    });

    test("returns matching fiscal year when found", () => {
        expect(findFundingBudgetFYByFiscalYear(mockCAN, 2023)).toBe(2023);
    });

    test("returns 0 when fiscal year not found", () => {
        expect(findFundingBudgetFYByFiscalYear(mockCAN, 2025)).toBe(0);
    });
});

describe("findFundingBudgetBudgetByFiscalYear", () => {
    const mockCAN = {
        funding_budgets: [
            { fiscal_year: 2022, budget: 1000 },
            { fiscal_year: 2023, budget: 2000 },
            { fiscal_year: 2024, budget: 3000 }
        ]
    };

    test("returns 0 for undefined CAN", () => {
        expect(findFundingBudgetBudgetByFiscalYear(undefined, 2023)).toBe(0);
    });

    test("returns 0 for undefined fiscal year", () => {
        expect(findFundingBudgetBudgetByFiscalYear(mockCAN, undefined)).toBe(0);
    });

    test("returns matching budget when fiscal year found", () => {
        expect(findFundingBudgetBudgetByFiscalYear(mockCAN, 2023)).toBe(2000);
    });

    test("returns 0 when fiscal year not found", () => {
        expect(findFundingBudgetBudgetByFiscalYear(mockCAN, 2025)).toBe(0);
    });
});
