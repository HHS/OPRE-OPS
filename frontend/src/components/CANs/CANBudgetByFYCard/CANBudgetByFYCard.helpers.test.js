import { describe, expect, it, vi } from "vitest";
import { summaryCard } from "./CANBudgetByFYCard.helpers";

// Mock getCurrentFiscalYear using Vitest's vi
vi.mock("../../../helpers/utils", () => ({
    getCurrentFiscalYear: vi.fn(() => 2025)
}));

describe("CANBudgetByFYCard helpers", () => {
    const mockFundingBudgets = [
        { fiscal_year: "2023", budget: 10000000 },
        { fiscal_year: "2021", budget: 200000 },
        { fiscal_year: "2024", budget: 0 }
    ];

    describe("summaryCard", () => {
        it("should calculate correct chart data for given funding budgets", () => {
            const result = summaryCard(mockFundingBudgets, "2023");

            expect(result.chartData).toHaveLength(5); // Should always return 5 years
            expect(result.chartData).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        FY: "2023",
                        total: 10000000,
                        ratio: 1,
                        color: expect.any(String)
                    }),
                    expect.objectContaining({
                        FY: "2021",
                        total: 200000,
                        ratio: 0.02,
                        color: expect.any(String)
                    })
                ])
            );
        });

        it("should handle empty funding budgets", () => {
            const result = summaryCard([], "2023");

            expect(result.chartData).toHaveLength(5);
            result.chartData.forEach((item) => {
                expect(item).toEqual(
                    expect.objectContaining({
                        total: 0,
                        ratio: 0,
                        color: expect.any(String)
                    })
                );
            });
        });

        it("should handle invalid fiscal years", () => {
            const invalidBudgets = [
                { fiscal_year: null, budget: 1000 },
                { fiscal_year: undefined, budget: 2000 },
                { fiscal_year: "2023", budget: 3000 }
            ];

            const result = summaryCard(invalidBudgets, "2026");

            const fy2023Data = result.chartData.find((item) => item.FY === "2023");
            expect(fy2023Data.total).toBe(3000);
            expect(result.chartData).toHaveLength(5);
        });

        it("should handle null/undefined budgets", () => {
            const invalidBudgets = [
                { fiscal_year: "2023", budget: null },
                { fiscal_year: "2023", budget: undefined },
                { fiscal_year: "2023", budget: 3000 }
            ];

            const result = summaryCard(invalidBudgets, "2023");

            const fy2023Data = result.chartData.find((item) => item.FY === "2023");
            expect(fy2023Data.total).toBe(3000);
        });
    });
});
