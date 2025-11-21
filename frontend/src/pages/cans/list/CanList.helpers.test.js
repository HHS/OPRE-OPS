import { describe, it, expect } from "vitest";
import { getPortfolioOptions, getSortedFYBudgets } from "./CanList.helpers";

/**
 * NOTE: Tests for sortAndFilterCANs and applyAdditionalFilters have been removed
 * as filtering and sorting are now handled server-side by the /cans API endpoint.
 * See backend tests in backend/ops_api/tests/ops/can/test_can.py for filter tests.
 */

describe("Portfolio filtering and options", () => {
    const mockCANsWithPortfolios = [
        {
            id: 1,
            obligate_by: "2023-12-31",
            portfolio: { division_id: 1, name: "Portfolio A", abbreviation: "ABC" },
            budget_line_items: [{ team_members: [{ id: 1 }] }],
            active_period: 1
        },
        {
            id: 2,
            obligate_by: "2023-11-30",
            portfolio: { division_id: 2, name: "Portfolio X", abbreviation: "XYZ" },
            budget_line_items: [],
            active_period: 2
        },
        {
            id: 3,
            obligate_by: "2023-10-31",
            portfolio: { division_id: 1, name: "Portfolio A", abbreviation: "ABC" },
            budget_line_items: [{ team_members: [{ id: 2 }] }],
            active_period: 1
        }
    ];

    it("should return unique portfolio options", () => {
        const portfolioOptions = getPortfolioOptions(mockCANsWithPortfolios);
        expect(portfolioOptions).toEqual([
            { abbr: "ABC", id: 0, title: "Portfolio A (ABC)" },
            { abbr: "XYZ", id: 1, title: "Portfolio X (XYZ)" }
        ]);
    });

    it("should return an empty array for getPortfolioOptions when input is null or empty", () => {
        expect(getPortfolioOptions(null)).toEqual([]);
        expect(getPortfolioOptions([])).toEqual([]);
    });
});

describe("getSortedFYBudgets", () => {
    const mockCANsWithBudgets = [
        {
            id: 1,
            funding_budgets: [
                { fiscal_year: 2025, budget: 50000 },
                { fiscal_year: 2024, budget: 30000 }
            ]
        },
        {
            id: 2,
            funding_budgets: [
                { fiscal_year: 2025, budget: 100000 },
                { fiscal_year: 2025, budget: null }
            ]
        },
        {
            id: 3,
            funding_budgets: [{ fiscal_year: 2025, budget: 25000 }]
        },
        {
            id: 4,
            funding_budgets: []
        }
    ];

    it("should return sorted unique budgets for a given fiscal year", () => {
        const result = getSortedFYBudgets(mockCANsWithBudgets, 2025);
        expect(result).toEqual([25000, 50000, 100000]);
    });

    it("should filter out null budgets", () => {
        const result = getSortedFYBudgets(mockCANsWithBudgets, 2025);
        expect(result).not.toContain(null);
    });

    it("should only return budgets for the specified fiscal year", () => {
        const result = getSortedFYBudgets(mockCANsWithBudgets, 2024);
        // When there's only one budget, it creates a range with 10% added
        expect(result).toEqual([30000, 33000]);
    });

    it("should return empty array when input is null or empty", () => {
        expect(getSortedFYBudgets(null, 2025)).toEqual([]);
        expect(getSortedFYBudgets([], 2025)).toEqual([]);
    });

    it("should handle single budget value by creating a range", () => {
        const singleBudgetCANs = [
            {
                id: 1,
                funding_budgets: [{ fiscal_year: 2025, budget: 100000 }]
            }
        ];
        const result = getSortedFYBudgets(singleBudgetCANs, 2025);
        expect(result).toHaveLength(2);
        expect(result[0]).toBe(100000);
        expect(result[1]).toBeCloseTo(110000, 0); // 100000 * 1.1, with floating point tolerance
    });
});
