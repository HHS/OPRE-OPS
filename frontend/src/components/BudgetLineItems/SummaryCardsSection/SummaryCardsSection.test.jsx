import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SummaryCardsSection from "./SummaryCardsSection";

vi.mock("../BudgetLinesTotalSummaryCard", () => ({
    default: ({ title }) => <div data-testid="total-card">{title}</div>
}));

vi.mock("../BLIStatusSummaryCard", () => ({
    default: ({ titlePrefix }) => <div data-testid="status-card">{titlePrefix}</div>
}));

describe("SummaryCardsSection — titlePrefix derivation", () => {
    const baseProps = {
        totalAmount: 0,
        totalDraftAmount: 0,
        totalPlannedAmount: 0,
        totalExecutingAmount: 0,
        totalObligatedAmount: 0
    };

    it("renders 'All FYs' prefix when fiscalYear is 'All FYs'", () => {
        render(
            <SummaryCardsSection
                {...baseProps}
                fiscalYear="All FYs"
            />
        );
        expect(screen.getByTestId("total-card")).toHaveTextContent("All FYs Budget Lines Total");
        expect(screen.getByTestId("status-card")).toHaveTextContent("All FYs");
    });

    it("renders 'Multiple Years' prefix when fiscalYear is 'Multi'", () => {
        render(
            <SummaryCardsSection
                {...baseProps}
                fiscalYear="Multi"
            />
        );
        expect(screen.getByTestId("total-card")).toHaveTextContent("Multiple Years Budget Lines Total");
        expect(screen.getByTestId("status-card")).toHaveTextContent("Multiple Years");
    });

    it("renders 'FY XXXX' prefix when fiscalYear is a specific year", () => {
        render(
            <SummaryCardsSection
                {...baseProps}
                fiscalYear="2025"
            />
        );
        expect(screen.getByTestId("total-card")).toHaveTextContent("FY 2025 Budget Lines Total");
        expect(screen.getByTestId("status-card")).toHaveTextContent("FY 2025");
    });
});
