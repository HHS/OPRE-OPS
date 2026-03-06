import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReportingPageData } from "./ReportingPage.hooks";
import * as opsAPI from "../../api/opsAPI";

vi.mock("../../api/opsAPI", () => ({
    useGetPortfolioFundingSummaryBatchQuery: vi.fn()
}));

describe("useReportingPageData", () => {
    const mockFundingData = {
        portfolios: [
            {
                id: 1,
                total_funding: { amount: 10000000 },
                planned_funding: { amount: 2000000 },
                obligated_funding: { amount: 3000000 },
                in_execution_funding: { amount: 1000000 }
            },
            {
                id: 2,
                total_funding: { amount: 5000000 },
                planned_funding: { amount: 500000 },
                obligated_funding: { amount: 1000000 },
                in_execution_funding: { amount: 500000 }
            }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return loading state when data is loading", () => {
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.totalFunding).toBe(0);
        expect(result.current.totalSpending).toBe(0);
    });

    it("should return error state when API fails", () => {
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.isError).toBe(true);
    });

    it("should aggregate totalFunding and totalSpending across all portfolios", () => {
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.totalFunding).toBe(15000000);
        // spending = (2M + 3M + 1M) + (500K + 1M + 500K) = 8M
        expect(result.current.totalSpending).toBe(8000000);
    });

    it("should initialize with the current fiscal year", () => {
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => useReportingPageData());

        const today = new Date();
        const expectedFY = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
        expect(result.current.fiscalYear).toBe(expectedFY);
    });

    it("should handle empty portfolios array", () => {
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: { portfolios: [] },
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.totalFunding).toBe(0);
        expect(result.current.totalSpending).toBe(0);
    });

    it("should handle portfolios with missing funding fields", () => {
        opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
            data: {
                portfolios: [
                    {
                        id: 1,
                        total_funding: { amount: 5000000 },
                        planned_funding: null,
                        obligated_funding: { amount: 1000000 },
                        in_execution_funding: null
                    }
                ]
            },
            isLoading: false,
            isError: false
        });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.totalFunding).toBe(5000000);
        expect(result.current.totalSpending).toBe(1000000);
    });
});
