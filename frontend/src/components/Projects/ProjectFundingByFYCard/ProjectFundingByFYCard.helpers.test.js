import { describe, it, expect } from "vitest";
import { buildFYChartData, getLast5FiscalYears } from "./ProjectFundingByFYCard.helpers";

describe("getLast5FiscalYears", () => {
    it("returns the last 5 FYs descending from the given year", () => {
        expect(getLast5FiscalYears(2025)).toEqual([2025, 2024, 2023, 2022, 2021]);
    });

    it("works for any fiscal year", () => {
        expect(getLast5FiscalYears(2027)).toEqual([2027, 2026, 2025, 2024, 2023]);
    });
});

describe("buildFYChartData", () => {
    const mockFundingByFiscalYear = [
        { fiscal_year: 2021, amount: 6000000 },
        { fiscal_year: 2022, amount: 4000000 },
        { fiscal_year: 2023, amount: 3000000 },
        { fiscal_year: 2024, amount: 2000000 },
        { fiscal_year: 2025, amount: 1500000 }
    ];

    it("returns exactly 5 items", () => {
        const result = buildFYChartData(mockFundingByFiscalYear, 2025);
        expect(result).toHaveLength(5);
    });

    it("starts with the selected fiscal year", () => {
        const result = buildFYChartData(mockFundingByFiscalYear, 2025);
        expect(result[0].FY).toBe(2025);
    });

    it("ends 4 years before the selected fiscal year", () => {
        const result = buildFYChartData(mockFundingByFiscalYear, 2025);
        expect(result[4].FY).toBe(2021);
    });

    it("uses zero for years not present in fundingByFiscalYear", () => {
        const result = buildFYChartData([], 2025);
        result.forEach((item) => expect(item.total).toBe(0));
    });

    it("assigns a ratio of 1 to the max value year", () => {
        const result = buildFYChartData(mockFundingByFiscalYear, 2025);
        // FY 2021 has max amount (6000000) — last item in array
        const maxItem = result.find((r) => r.FY === 2021);
        expect(maxItem.ratio).toBe(1);
    });

    it("assigns a ratio of 0 to years with zero funding", () => {
        const result = buildFYChartData([], 2025);
        // All zeros — maxTotal clamps to 1, so ratio is 0/1 = 0
        result.forEach((item) => expect(item.ratio).toBe(0));
    });

    it("assigns a color from budgetsByFYChartColors to each bar", () => {
        const result = buildFYChartData(mockFundingByFiscalYear, 2025);
        result.forEach((item) => {
            expect(item.color).toMatch(/var\(--project-funding-by-fy-graph-/);
        });
    });

    it("handles a selected FY beyond the data range, showing zeros for missing years", () => {
        const result = buildFYChartData(mockFundingByFiscalYear, 2027);
        const fy2027 = result.find((r) => r.FY === 2027);
        const fy2026 = result.find((r) => r.FY === 2026);
        expect(fy2027.total).toBe(0);
        expect(fy2026.total).toBe(0);
    });

    it("handles null/undefined fundingByFiscalYear gracefully", () => {
        expect(() => buildFYChartData(null, 2025)).not.toThrow();
        expect(() => buildFYChartData(undefined, 2025)).not.toThrow();
    });
});
