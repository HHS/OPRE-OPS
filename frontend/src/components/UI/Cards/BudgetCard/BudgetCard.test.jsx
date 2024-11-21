import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import BudgetCard from "./BudgetCard";

describe("BudgetSummaryCard", () => {
    const defaultProps = {
        cardId: 2025,
        title: "Budget Summary",
        totalSpending: 15000,
        totalFunding: 20000
    };

    it("renders with all required props", () => {
        render(<BudgetCard {...defaultProps} />);

        expect(screen.getByText("Budget Summary")).toBeInTheDocument();
        expect(screen.getByText("$ 5,000")).toBeInTheDocument();
        expect(screen.getByText("Available")).toBeInTheDocument();
    });

    it("displays over budget warning when spending exceeds funding", () => {
        const overBudgetProps = {
            ...defaultProps,
            totalSpending: 25000,
            totalFunding: 20000
        };

        render(<BudgetCard {...overBudgetProps} />);

        expect(screen.getByTitle("Over Budget")).toBeInTheDocument();
    });

    it("displays correct spending and funding amounts", () => {
        render(<BudgetCard {...defaultProps} />);

        const spendingText = screen.getByText(/\$15,000/);
        const fundingText = screen.getByText(/\$20,000/);

        expect(spendingText).toBeInTheDocument();
        expect(fundingText).toBeInTheDocument();
    });

    it("handles zero values correctly", () => {
        const zeroProps = {
            ...defaultProps,
            totalSpending: 0,
            totalFunding: 0
        };

        render(<BudgetCard {...zeroProps} />);

        expect(screen.queryAllByText("$0.00")).toHaveLength(2);
    });
});
