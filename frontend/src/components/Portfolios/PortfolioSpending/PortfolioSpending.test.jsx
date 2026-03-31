import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortfolioSpending from "./PortfolioSpending";

const useOutletContextMock = vi.fn();
const useGetPortfolioCansByIdQueryMock = vi.fn();
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
    useLazyGetBudgetLineItemQuery: (...args) => useLazyGetBudgetLineItemQueryMock(...args)
}));

vi.mock("../PortfolioBudgetSummary", () => ({
    default: () => <div>Portfolio summary card</div>
}));

vi.mock("../../CANs/CANBudgetLineTable", () => ({
    default: () => <div>Portfolio budget line table</div>
}));

describe("PortfolioSpending", () => {
    beforeEach(() => {
        useOutletContextMock.mockReturnValue({
            portfolioId: 7,
            fiscalYear: 2026,
            projectTypesCount: [],
            inDraftFunding: 10,
            totalFunding: 100,
            inExecutionFunding: 20,
            obligatedFunding: 30,
            plannedFunding: 40
        });

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
});
