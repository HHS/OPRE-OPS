import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CANSummaryCards from "./CANSummaryCards";

// LineGraph uses DOM layout APIs unavailable in jsdom — mock the whole card
// so tests can focus on the data-transformation logic (percent labels).
vi.mock("../../UI/DataViz/LineGraph", () => ({
    default: () => <div data-testid="mock-line-graph" />
}));

const defaultProps = {
    fiscalYear: 2024,
    totalBudget: 1000,
    newFunding: 500,
    carryForward: 500,
    plannedFunding: 100,
    obligatedFunding: 150,
    inExecutionFunding: 200
};

describe("CANSummaryCards", () => {
    it("renders without crashing", () => {
        render(<CANSummaryCards {...defaultProps} />);
        expect(screen.getByText("FY 2024 CANs Total Budget")).toBeInTheDocument();
    });

    it("renders the total budget heading with fiscal year", () => {
        render(<CANSummaryCards {...defaultProps} />);
        expect(screen.getByText("FY 2024 CANs Total Budget")).toBeInTheDocument();
    });

    it("renders the available budget heading with fiscal year", () => {
        render(<CANSummaryCards {...defaultProps} />);
        expect(screen.getByText("FY 2024 CANs Available Budget")).toBeInTheDocument();
    });

    it("renders both legend labels", () => {
        render(<CANSummaryCards {...defaultProps} />);
        expect(screen.getByText("Previous FYs Carry-Forward")).toBeInTheDocument();
        expect(screen.getByText("FY 2024 New Funding")).toBeInTheDocument();
    });

    it("shows 50% for each item in a balanced split", () => {
        render(<CANSummaryCards {...defaultProps} />);
        const tags = screen.getAllByTestId("legend-tag");
        expect(tags[0]).toHaveTextContent("50%");
        expect(tags[1]).toHaveTextContent("50%");
    });

    it("dominant carry-forward shows '99%' instead of '100%' (Figma: no >99%)", () => {
        render(
            <CANSummaryCards
                {...defaultProps}
                carryForward={996}
                newFunding={4}
                totalBudget={1000}
            />
        );
        expect(screen.getByText("99%")).toBeInTheDocument();
        expect(screen.queryByText(">99%")).not.toBeInTheDocument();
        expect(screen.queryByText("100%")).not.toBeInTheDocument();
    });

    it("tiny new-funding shows '<1%' instead of '0%'", () => {
        render(
            <CANSummaryCards
                {...defaultProps}
                carryForward={996}
                newFunding={4}
                totalBudget={1000}
            />
        );
        expect(screen.getByText("<1%")).toBeInTheDocument();
        expect(screen.queryByText("0%")).not.toBeInTheDocument();
    });

    it("dominant new-funding shows '99%' instead of '100%' (Figma: no >99%)", () => {
        render(
            <CANSummaryCards
                {...defaultProps}
                carryForward={4}
                newFunding={996}
                totalBudget={1000}
            />
        );
        expect(screen.getByText("99%")).toBeInTheDocument();
        expect(screen.queryByText(">99%")).not.toBeInTheDocument();
        expect(screen.queryByText("100%")).not.toBeInTheDocument();
    });

    it("tiny carry-forward shows '<1%' instead of '0%'", () => {
        render(
            <CANSummaryCards
                {...defaultProps}
                carryForward={4}
                newFunding={996}
                totalBudget={1000}
            />
        );
        expect(screen.getByText("<1%")).toBeInTheDocument();
        expect(screen.queryByText("0%")).not.toBeInTheDocument();
    });

    it("sole non-zero carry-forward shows '100%' with zero new-funding showing '0%'", () => {
        render(
            <CANSummaryCards
                {...defaultProps}
                carryForward={1000}
                newFunding={0}
                totalBudget={1000}
            />
        );
        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("computes totalSpending as sum of planned + obligated + inExecution funding", () => {
        // plannedFunding=100 + obligatedFunding=150 + inExecutionFunding=200 = 450
        // remainingBudget = totalBudget(1000) - totalSpending(450) = 550
        render(<CANSummaryCards {...defaultProps} />);
        // BudgetCard shows "*Spending $X of $Y" — verify the spending total is correct
        expect(screen.getByText(/\$450/)).toBeInTheDocument();
    });
});
