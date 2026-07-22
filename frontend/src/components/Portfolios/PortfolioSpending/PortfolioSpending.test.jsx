import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortfolioSpending from "./PortfolioSpending";

const useOutletContextMock = vi.fn();
const useGetPortfolioCansByIdQueryMock = vi.fn();
const useGetReportingSummaryQueryMock = vi.fn();
const useLazyGetBudgetLineItemQueryMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useOutletContext: () => useOutletContextMock()
    };
});

vi.mock("../../../api/opsAPI", () => ({
    useGetPortfolioCansByIdQuery: (...args) => useGetPortfolioCansByIdQueryMock(...args),
    useGetReportingSummaryQuery: (...args) => useGetReportingSummaryQueryMock(...args),
    useLazyGetBudgetLineItemQuery: (...args) => useLazyGetBudgetLineItemQueryMock(...args)
}));

vi.mock("../PortfolioBudgetSummary", () => ({
    default: ({ spendingData, counts }) => (
        <div>
            Portfolio summary card
            <span data-testid="spending-data">{JSON.stringify(spendingData)}</span>
            <span data-testid="counts-data">{JSON.stringify(counts)}</span>
        </div>
    )
}));

vi.mock("../../CANs/CANBudgetLineTable", () => ({
    default: () => <div>Portfolio budget line table</div>
}));

describe("PortfolioSpending", () => {
    beforeEach(() => {
        useOutletContextMock.mockReturnValue({
            portfolioId: 7,
            fiscalYear: 2026,
            inDraftFunding: 10,
            totalFunding: 100,
            inExecutionFunding: 20,
            obligatedFunding: 30,
            plannedFunding: 40
        });

        useGetReportingSummaryQueryMock.mockReturnValue({ data: undefined });
        useLazyGetBudgetLineItemQueryMock.mockReturnValue([vi.fn(), { isLoading: false }]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("keeps the summary mounted while showing the portfolio table skeleton", () => {
        useGetPortfolioCansByIdQueryMock.mockReturnValue({
            data: undefined,
            isLoading: true,
            isFetching: false
        });

        render(<PortfolioSpending />);

        expect(screen.getByText("Portfolio Budget & Spending Summary")).toBeInTheDocument();
        expect(screen.getByText("Portfolio summary card")).toBeInTheDocument();
        expect(screen.getByRole("table", { name: "Loading portfolio budget lines" })).toBeInTheDocument();
        expect(screen.queryByText("Portfolio budget line table")).not.toBeInTheDocument();
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("passes spending and counts from reporting summary to PortfolioBudgetSummary", () => {
        const mockSpending = {
            agreement_types: [
                { type: "CONTRACT", total: 500_000 },
                { type: "GRANT", total: 200_000 }
            ]
        };
        const mockCounts = { total: 12, active: 9 };

        useGetReportingSummaryQueryMock.mockReturnValue({
            data: { spending: mockSpending, counts: mockCounts }
        });

        useGetPortfolioCansByIdQueryMock.mockReturnValue({
            data: [],
            isLoading: false,
            isFetching: false
        });

        render(<PortfolioSpending />);

        expect(screen.getByTestId("spending-data")).toHaveTextContent(JSON.stringify(mockSpending));
        expect(screen.getByTestId("counts-data")).toHaveTextContent(JSON.stringify(mockCounts));
    });

    it("passes undefined spending and counts when reporting summary has no data", () => {
        useGetReportingSummaryQueryMock.mockReturnValue({ data: undefined });

        useGetPortfolioCansByIdQueryMock.mockReturnValue({
            data: [],
            isLoading: false,
            isFetching: false
        });

        render(<PortfolioSpending />);

        expect(screen.getByTestId("spending-data")).toBeEmptyDOMElement();
        expect(screen.getByTestId("counts-data")).toBeEmptyDOMElement();
    });
});
