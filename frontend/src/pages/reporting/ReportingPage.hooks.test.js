import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReportingPageData } from "./ReportingPage.hooks";
import * as opsAPI from "../../api/opsAPI";

vi.mock("../../api/opsAPI", () => ({
    useGetPortfolioFundingSummaryBatchQuery: vi.fn(),
    useGetPortfoliosQuery: vi.fn()
}));

const mockAllPortfolios = [
    { id: 1, name: "Portfolio A", abbreviation: "PA" },
    { id: 2, name: "Portfolio B", abbreviation: "PB" }
];

const mockFundingData = {
    portfolios: [
        {
            id: 1,
            total_funding: { amount: 10000000 },
            planned_funding: { amount: 2000000 },
            obligated_funding: { amount: 3000000 },
            in_execution_funding: { amount: 1000000 },
            available_funding: { amount: 4000000 },
            carry_forward_funding: { amount: 500000 },
            new_funding: { amount: 9500000 },
            draft_funding: { amount: 1000000 }
        },
        {
            id: 2,
            total_funding: { amount: 5000000 },
            planned_funding: { amount: 500000 },
            obligated_funding: { amount: 1000000 },
            in_execution_funding: { amount: 500000 },
            available_funding: { amount: 3000000 },
            carry_forward_funding: { amount: 200000 },
            new_funding: { amount: 4800000 },
            draft_funding: { amount: 500000 }
        }
    ]
};

const setupMocks = (overrides = {}) => {
    const {
        portfolios = mockAllPortfolios,
        funding = mockFundingData,
        loadingPortfolios = false,
        loadingFunding = false,
        errorPortfolios = false,
        errorFunding = false
    } = overrides;

    opsAPI.useGetPortfoliosQuery.mockReturnValue({
        data: "portfolios" in overrides ? overrides.portfolios : portfolios,
        isLoading: loadingPortfolios,
        isError: errorPortfolios
    });
    opsAPI.useGetPortfolioFundingSummaryBatchQuery.mockReturnValue({
        data: "funding" in overrides ? overrides.funding : funding,
        isLoading: loadingFunding,
        isError: errorFunding
    });
};

describe("useReportingPageData", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return loading state when data is loading", () => {
        setupMocks({ loadingPortfolios: true, loadingFunding: true, portfolios: null, funding: null });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.totalFunding).toBe(0);
        expect(result.current.totalSpending).toBe(0);
    });

    it("should return error state when API fails", () => {
        setupMocks({ errorFunding: true, portfolios: null, funding: null });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.isError).toBe(true);
    });

    it("should aggregate totalFunding and totalSpending across all portfolios", () => {
        setupMocks();

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.totalFunding).toBe(15000000);
        // spending = (2M + 3M + 1M) + (500K + 1M + 500K) = 8M
        expect(result.current.totalSpending).toBe(8000000);
    });

    it("should initialize with the current fiscal year", () => {
        setupMocks();

        const { result } = renderHook(() => useReportingPageData());

        const today = new Date();
        const expectedFY = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
        expect(result.current.fiscalYear).toBe(expectedFY);
    });

    it("should handle empty portfolios array", () => {
        setupMocks({ funding: { portfolios: [] } });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.totalFunding).toBe(0);
        expect(result.current.totalSpending).toBe(0);
        expect(result.current.portfoliosWithFunding).toEqual([]);
    });

    it("should handle portfolios with missing funding fields", () => {
        setupMocks({
            portfolios: [{ id: 1, name: "Portfolio A", abbreviation: "PA" }],
            funding: {
                portfolios: [
                    {
                        id: 1,
                        total_funding: { amount: 5000000 },
                        planned_funding: null,
                        obligated_funding: { amount: 1000000 },
                        in_execution_funding: null
                    }
                ]
            }
        });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.totalFunding).toBe(5000000);
        expect(result.current.totalSpending).toBe(1000000);
    });

    it("should merge portfolios with funding data into portfoliosWithFunding", () => {
        setupMocks();

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.portfoliosWithFunding).toHaveLength(2);
        expect(result.current.portfoliosWithFunding[0].name).toBe("Portfolio A");
        expect(result.current.portfoliosWithFunding[0].abbreviation).toBe("PA");
        expect(result.current.portfoliosWithFunding[0].fundingSummary.total_funding.amount).toBe(10000000);
    });

    it("should filter out funding portfolios not found in allPortfolios", () => {
        setupMocks({ portfolios: [mockAllPortfolios[0]] }); // Only portfolio 1

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.portfoliosWithFunding).toHaveLength(1);
        expect(result.current.portfoliosWithFunding[0].id).toBe(1);
    });

    it("should return empty portfoliosWithFunding when allPortfolios is not available", () => {
        setupMocks({ portfolios: null });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.portfoliosWithFunding).toEqual([]);
    });
});
