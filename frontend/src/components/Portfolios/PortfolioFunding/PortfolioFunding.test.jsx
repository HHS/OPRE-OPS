import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PortfolioFunding from "./PortfolioFunding";

// PortfolioFunding reads context from a router outlet and fires RTK Query hooks.
// Mock both so tests can focus on the percent-label logic.
vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useOutletContext: vi.fn()
    };
});

// The lazy trigger fires inside a useEffect and calls .unwrap() — mock it to
// resolve immediately with a zero-funding summary so the effect completes.
const mockTrigger = vi.fn(() => ({
    unwrap: () => Promise.resolve({ total_funding: { amount: 0 } })
}));

vi.mock("../../../api/opsAPI", () => ({
    useGetPortfolioCansByIdQuery: vi.fn(() => ({ data: [], isLoading: false })),
    useLazyGetPortfolioFundingSummaryQuery: vi.fn(() => [mockTrigger])
}));

// LineGraph relies on DOM layout APIs unavailable in jsdom — mock it.
vi.mock("../../UI/DataViz/LineGraph", () => ({
    default: () => <div data-testid="mock-line-graph" />
}));

import { useOutletContext } from "react-router-dom";

const makeContext = (overrides = {}) => ({
    portfolioId: 1,
    fiscalYear: "2024",
    carryForward: 500,
    newFunding: 500,
    totalFunding: 1000,
    ...overrides
});

describe("PortfolioFunding — percent labels", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTrigger.mockReturnValue({
            unwrap: () => Promise.resolve({ total_funding: { amount: 0 } })
        });
    });

    it("shows 50% for each item in a balanced split", () => {
        useOutletContext.mockReturnValue(makeContext());
        render(<PortfolioFunding />);
        const tags = screen.getAllByTestId("legend-tag");
        expect(tags[0]).toHaveTextContent("50%");
        expect(tags[1]).toHaveTextContent("50%");
    });

    it("dominant carry-forward shows '99%' instead of '100%' (Figma: no >99%)", () => {
        useOutletContext.mockReturnValue(makeContext({ carryForward: 996, newFunding: 4, totalFunding: 1000 }));
        render(<PortfolioFunding />);
        expect(screen.getByText("99%")).toBeInTheDocument();
        expect(screen.queryByText(">99%")).not.toBeInTheDocument();
        expect(screen.queryByText("100%")).not.toBeInTheDocument();
    });

    it("tiny new-funding shows '<1%' instead of '0%'", () => {
        useOutletContext.mockReturnValue(makeContext({ carryForward: 996, newFunding: 4, totalFunding: 1000 }));
        render(<PortfolioFunding />);
        expect(screen.getByText("<1%")).toBeInTheDocument();
    });

    it("dominant new-funding shows '99%' instead of '100%' (Figma: no >99%)", () => {
        useOutletContext.mockReturnValue(makeContext({ carryForward: 4, newFunding: 996, totalFunding: 1000 }));
        render(<PortfolioFunding />);
        expect(screen.getByText("99%")).toBeInTheDocument();
        expect(screen.queryByText(">99%")).not.toBeInTheDocument();
        expect(screen.queryByText("100%")).not.toBeInTheDocument();
    });

    it("sole non-zero item shows 100% (no peers — correct)", () => {
        useOutletContext.mockReturnValue(makeContext({ carryForward: 1000, newFunding: 0, totalFunding: 1000 }));
        render(<PortfolioFunding />);
        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("renders the funding summary heading", () => {
        useOutletContext.mockReturnValue(makeContext());
        render(<PortfolioFunding />);
        expect(screen.getByText("Portfolio Funding Summary")).toBeInTheDocument();
    });

    it("renders both legend labels", () => {
        useOutletContext.mockReturnValue(makeContext());
        render(<PortfolioFunding />);
        expect(screen.getByText("Previous FYs Carry-Forward")).toBeInTheDocument();
        expect(screen.getByText("FY 2024 New Funding")).toBeInTheDocument();
    });
});
