import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePortfolioList } from "./PortfolioList.hooks";
import * as opsAPI from "../../../api/opsAPI";
import { DEFAULT_PORTFOLIO_BUDGET_RANGE } from "../../../constants";

// Mock the API
vi.mock("../../../api/opsAPI", () => ({
    useGetPortfoliosQuery: vi.fn(),
    useGetPortfolioFundingSummaryBatchQuery: vi.fn()
}));

describe("usePortfolioList", () => {
    const mockSearchParams = new URLSearchParams();
    const currentUserId = 1;

    const mockAllPortfolios = [
        { id: 1, name: "Portfolio A", abbreviation: "PA", team_leaders: [{ id: 1 }] },
        { id: 2, name: "Portfolio B", abbreviation: "PB", team_leaders: [{ id: 2 }] },
        { id: 3, name: "Portfolio C", abbreviation: "PC", team_leaders: [{ id: 1 }] }
    ];

    const mockFundingData = {
        portfolios: [
            {
                id: 1,
                total_funding: { amount: 10000000 },
                available_funding: { amount: 5000000 },
                carry_forward_funding: { amount: 1000000 },
                new_funding: { amount: 9000000 },
                planned_funding: { amount: 2000000 },
                obligated_funding: { amount: 3000000 },
                in_execution_funding: { amount: 2000000 },
                draft_funding: { amount: 3000000 }
            },
            {
                id: 2,
                total_funding: { amount: 50000000 },
                available_funding: { amount: 25000000 },
                carry_forward_funding: { amount: 5000000 },
                new_funding: { amount: 45000000 },
                planned_funding: { amount: 10000000 },
                obligated_funding: { amount: 15000000 },
                in_execution_funding: { amount: 10000000 },
                draft_funding: { amount: 15000000 }
            },
            {
                id: 3,
                total_funding: { amount: 25000000 },
                available_funding: { amount: 12500000 },
                carry_forward_funding: { amount: 2500000 },
                new_funding: { amount: 22500000 },
                planned_funding: { amount: 5000000 },
                obligated_funding: { amount: 7500000 },
                in_execution_funding: { amount: 5000000 },
                draft_funding: { amount: 7500000 }
            }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams.delete("tab");
    });

    it("should return initial state with loading true when data is loading", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.isError).toBe(false);
    });

    it("should return error state when API fails", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(true);
    });

    it("should return portfolios with funding data when loaded", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        expect(result.current.isLoading).toBe(false);
        expect(result.current.portfoliosWithFunding).toHaveLength(3);
        expect(result.current.portfoliosWithFunding[0]).toHaveProperty("fundingSummary");
        expect(result.current.portfoliosWithFunding[0].fundingSummary.total_funding.amount).toBe(10000000);
    });

    it("should filter portfolios for 'my' tab", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            isError: false
        });

        mockSearchParams.set("tab", "my");

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        // User 1 is team leader for portfolios 1 and 3
        expect(result.current.filteredPortfolios).toHaveLength(2);
        expect(result.current.filteredPortfolios[0].id).toBe(1);
        expect(result.current.filteredPortfolios[1].id).toBe(3);
    });

    it("should calculate budget range from unfiltered data", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        expect(result.current.fyBudgetRange).toEqual([10000000, 50000000]);
    });

    it("should initialize with current fiscal year by default", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        // Should default to current fiscal year (as string since getCurrentFiscalYear returns string)
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const expectedFY = currentMonth >= 10 ? currentYear + 1 : currentYear;
        expect(result.current.selectedFiscalYear).toBe(expectedFY.toString());
    });

    it("should initialize with 'all' tab by default", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        expect(result.current.activeTab).toBe("all");
    });

    it("should read tab from URL on mount", () => {
        mockSearchParams.set("tab", "my");

        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        expect(result.current.activeTab).toBe("my");
    });

    it("should initialize filters as empty", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        expect(result.current.filters.portfolios).toEqual([]);
        expect(result.current.filters.budgetRange).toEqual(DEFAULT_PORTFOLIO_BUDGET_RANGE);
        expect(result.current.filters.availablePct).toEqual([]);
    });

    it("should handle portfolios not found in allPortfolios gracefully", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: [mockAllPortfolios[0]], // Only portfolio 1
            isLoading: false,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData, // Contains portfolios 1, 2, 3
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        // Should only include portfolio 1, others filtered out
        expect(result.current.portfoliosWithFunding).toHaveLength(1);
        expect(result.current.portfoliosWithFunding[0].id).toBe(1);
    });

    it("should return default budget range when no funding data", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: { portfolios: [] },
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        expect(result.current.fyBudgetRange).toEqual(DEFAULT_PORTFOLIO_BUDGET_RANGE);
    });

    it("should return buffered budget range when only one portfolio has valid budget (min === max)", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });

        // Only one portfolio has a valid budget, others are TBD (0 or null)
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: {
                portfolios: [
                    {
                        id: 1,
                        total_funding: { amount: 50000 },
                        available_funding: { amount: 25000 }
                    },
                    {
                        id: 2,
                        total_funding: { amount: 0 },
                        available_funding: { amount: 0 }
                    },
                    {
                        id: 3,
                        total_funding: null,
                        available_funding: null
                    }
                ]
            },
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        // Should return buffered range (±10%) to avoid slider division by zero
        // Budget is 50000, so range should be [45000, 55001] (Math.ceil handles floating point)
        expect(result.current.fyBudgetRange).toEqual([45000, 55001]);
    });

    it("should return buffered budget range when all portfolios have same budget", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });

        // All portfolios have the same budget
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: {
                portfolios: [
                    {
                        id: 1,
                        total_funding: { amount: 50000 },
                        available_funding: { amount: 25000 }
                    },
                    {
                        id: 2,
                        total_funding: { amount: 50000 },
                        available_funding: { amount: 25000 }
                    },
                    {
                        id: 3,
                        total_funding: { amount: 50000 },
                        available_funding: { amount: 25000 }
                    }
                ]
            },
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        // Should return buffered range (±10%) to avoid slider division by zero
        // All budgets are 50000, so range should be [45000, 55001] (Math.ceil handles floating point)
        expect(result.current.fyBudgetRange).toEqual([45000, 55001]);
    });

    it("should handle null filter values gracefully", () => {
        opsAPI.useGetPortfoliosQuery.mockReturnValue({
            data: mockAllPortfolios,
            isLoading: false,
            isError: false
        });
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => usePortfolioList({ currentUserId, searchParams: mockSearchParams }));

        // This should not crash the hook
        expect(() => {
            result.current.setFilters({
                portfolios: null,
                budgetRange: DEFAULT_PORTFOLIO_BUDGET_RANGE,
                availablePct: null
            });
        }).not.toThrow();

        // The hook should still work without crashing and return valid data
        expect(result.current.portfoliosWithFunding).toBeDefined();
        expect(Array.isArray(result.current.portfoliosWithFunding)).toBe(true);
        expect(result.current.filteredPortfolios).toBeDefined();
        expect(Array.isArray(result.current.filteredPortfolios)).toBe(true);
    });
});
