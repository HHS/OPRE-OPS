import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReportingPageData } from "./ReportingPage.hooks";
import * as opsAPI from "../../api/opsAPI";

vi.mock("../../api/opsAPI", () => ({
    useGetPortfolioFundingSummaryBatchQuery: vi.fn(),
    useGetPortfoliosQuery: vi.fn(),
    useGetReportingSummaryQuery: vi.fn()
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

const mockReportingSummaryData = {
    spending: {
        total_spending: 5000000,
        agreement_types: [
            { type: "CONTRACT", label: "Contracts", total: 3000000, percent: "60", new: 2000000, continuing: 1000000 },
            { type: "PARTNER", label: "Partner", total: 1000000, percent: "20", new: 500000, continuing: 500000 },
            { type: "GRANT", label: "Grants", total: 500000, percent: "10", new: 300000, continuing: 200000 },
            {
                type: "DIRECT_OBLIGATION",
                label: "Direct Oblig.",
                total: 500000,
                percent: "10",
                new: 250000,
                continuing: 250000
            }
        ]
    },
    counts: {
        projects: { total: 34, types: [{ type: "RESEARCH", count: 24 }] },
        agreements: { total: 40, types: [{ type: "CONTRACT", count: 20 }] },
        new_agreements: { total: 17, types: [{ type: "CONTRACT", count: 10 }] },
        continuing_agreements: { total: 15, types: [{ type: "CONTRACT", count: 10 }] },
        budget_lines: { total: 80, types: [{ type: "DRAFT", count: 10 }] }
    }
};

const setupMocks = (overrides = {}) => {
    const {
        portfolios = mockAllPortfolios,
        funding = mockFundingData,
        reportingSummary = mockReportingSummaryData,
        loadingPortfolios = false,
        loadingFunding = false,
        loadingReportingSummary = false,
        errorPortfolios = false,
        errorFunding = false,
        errorReportingSummary = false
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
    opsAPI.useGetReportingSummaryQuery.mockReturnValue({
        data: "reportingSummary" in overrides ? overrides.reportingSummary : reportingSummary,
        isLoading: loadingReportingSummary,
        isError: errorReportingSummary
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

    it("should return agreementSpendingData from the reporting summary response", () => {
        setupMocks();

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.agreementSpendingData).toEqual(mockReportingSummaryData.spending);
        expect(result.current.agreementSpendingData.total_spending).toBe(5000000);
    });

    it("should return reportingSummaryData (counts) from the reporting summary response", () => {
        setupMocks();

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.reportingSummaryData).toEqual(mockReportingSummaryData.counts);
        expect(result.current.reportingSummaryData.projects.total).toBe(34);
    });

    it("should include reporting summary loading state in isLoading", () => {
        setupMocks({ loadingReportingSummary: true, reportingSummary: null });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.isLoading).toBe(true);
    });

    it("should aggregate bliStatusSpending across all portfolios", () => {
        setupMocks();

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.bliStatusSpending).toEqual({
            draft: 1500000,
            planned: 2500000,
            inExecution: 1500000,
            obligated: 4000000,
            total: 9500000
        });
    });

    it("should return zero bliStatusSpending when fundingData is unavailable", () => {
        setupMocks({ funding: null });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.bliStatusSpending).toEqual({
            draft: 0,
            planned: 0,
            inExecution: 0,
            obligated: 0,
            total: 0
        });
    });

    it("should include reporting summary error state in isError", () => {
        setupMocks({ errorReportingSummary: true, reportingSummary: null });

        const { result } = renderHook(() => useReportingPageData());

        expect(result.current.isError).toBe(true);
    });
});
