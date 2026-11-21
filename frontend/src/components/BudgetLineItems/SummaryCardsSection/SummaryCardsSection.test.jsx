import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SummaryCardsSection from "./SummaryCardsSection";

vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent", () => ({
    default: () => <div data-testid="donut-chart" />
}));

vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent", () => ({
    default: () => () => null
}));

const amounts = {
    totalAmount: 10000,
    totalDraftAmount: 1000,
    totalPlannedAmount: 2000,
    totalExecutingAmount: 3000,
    totalObligatedAmount: 4000
};

describe("SummaryCardsSection", () => {
    it.each([
        ["All FYs", "All FYs"],
        ["Multi", "Multiple Years"],
        ["2025", "FY 2025"]
    ])("titles both cards for fiscal year %s", (fiscalYear, expectedPrefix) => {
        render(
            <SummaryCardsSection
                {...amounts}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByRole("heading", { name: `${expectedPrefix} Budget Lines Total` })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: `${expectedPrefix} Budget Lines By Status` })).toBeInTheDocument();
    });

    it("shows the total and each status amount", () => {
        render(
            <SummaryCardsSection
                {...amounts}
                fiscalYear="2025"
            />
        );

        expect(screen.getByText("$ 10,000")).toBeInTheDocument();
        ["Draft", "Planned", "Executing", "Obligated"].forEach((label) => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
        ["$1,000.00", "$2,000.00", "$3,000.00", "$4,000.00"].forEach((amount) => {
            expect(screen.getByText(amount)).toBeInTheDocument();
        });
        expect(screen.getByTestId("donut-chart")).toBeInTheDocument();
    });
});
