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

    it("shows the total and pairs each status with its own amount", () => {
        render(
            <SummaryCardsSection
                {...amounts}
                fiscalYear="2025"
            />
        );

        expect(screen.getByText("$ 10,000")).toBeInTheDocument();
        // Each legend row renders its label then its amount, so document order pairs them.
        const labels = screen.getAllByText(/^(Draft|Planned|Executing|Obligated)$/).map((el) => el.textContent);
        const values = screen.getAllByText(/^\$\d{1,3}(,\d{3})*\.\d{2}$/).map((el) => el.textContent);
        expect(Object.fromEntries(labels.map((label, i) => [label, values[i]]))).toEqual({
            Draft: "$1,000.00",
            Planned: "$2,000.00",
            Executing: "$3,000.00",
            Obligated: "$4,000.00"
        });
        expect(screen.getByTestId("donut-chart")).toBeInTheDocument();
    });
});
