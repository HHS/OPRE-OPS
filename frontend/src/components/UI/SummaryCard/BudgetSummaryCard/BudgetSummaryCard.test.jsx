import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import BudgetSummaryCard from "./BudgetSummaryCard";

describe("BudgetSummaryCard", () => {
    const defaultProps = {
        title: "Budget Summary",
        remainingBudget: 5000,
        totalSpending: 15000,
        totalFunding: 20000
    };

    it("renders with all required props", () => {
        render(<BudgetSummaryCard {...defaultProps} />);

        expect(screen.getByText("Budget Summary")).toBeInTheDocument();
        expect(screen.getByText("$ 5,000")).toBeInTheDocument();
        expect(screen.getByText("Available")).toBeInTheDocument();
    });

    it("displays over budget warning when spending exceeds funding", () => {
        const overBudgetProps = {
            ...defaultProps,
            remainingBudget: -5000,
            totalSpending: 25000,
            totalFunding: 20000
        };

        render(<BudgetSummaryCard {...overBudgetProps} />);

        expect(screen.getByTitle("Over Budget")).toBeInTheDocument();
    });

    it("displays correct spending and funding amounts", () => {
        render(<BudgetSummaryCard {...defaultProps} />);

        const spendingText = screen.getByText(/\$15,000/);
        const fundingText = screen.getByText(/\$20,000/);

        expect(spendingText).toBeInTheDocument();
        expect(fundingText).toBeInTheDocument();
    });

    it("handles zero values correctly", () => {
        const zeroProps = {
            ...defaultProps,
            remainingBudget: 0,
            totalSpending: 0,
            totalFunding: 0
        };

        render(<BudgetSummaryCard {...zeroProps} />);

        expect(screen.queryAllByText("$0")).toHaveLength(2);
    });
});
