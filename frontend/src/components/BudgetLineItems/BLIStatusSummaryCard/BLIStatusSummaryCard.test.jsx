import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BLIStatusSummaryCard from "./BLIStatusSummaryCard";

// Nivo charts render SVG asynchronously and rely on browser layout APIs that
// are not available in jsdom. Mock the donut chart to keep tests focused on
// the data-transformation logic (percent labels).
vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent", () => ({
    default: ({ data }) => (
        <div data-testid="mock-donut">
            {data.map((d) => (
                <span
                    key={d.id}
                    data-testid={`donut-slice-${d.id}`}
                >
                    {d.label}:{d.value}
                </span>
            ))}
        </div>
    )
}));

vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent", () => ({
    default: () => () => null
}));

const defaultProps = {
    totalAmount: 1000,
    totalDraftAmount: 250,
    totalPlannedAmount: 250,
    totalExecutingAmount: 250,
    totalObligatedAmount: 250,
    titlePrefix: "FY 2024"
};

describe("BLIStatusSummaryCard", () => {
    it("renders the title prefix correctly", () => {
        render(<BLIStatusSummaryCard {...defaultProps} />);
        expect(screen.getByText("FY 2024 Budget Lines By Status")).toBeInTheDocument();
    });

    it("renders all four status labels", () => {
        render(<BLIStatusSummaryCard {...defaultProps} />);
        expect(screen.getByText("Draft")).toBeInTheDocument();
        expect(screen.getByText("Planned")).toBeInTheDocument();
        expect(screen.getByText("Executing")).toBeInTheDocument();
        expect(screen.getByText("Obligated")).toBeInTheDocument();
    });

    it("shows 25% for each status in an equal split", () => {
        render(<BLIStatusSummaryCard {...defaultProps} />);
        const percentTags = screen.getAllByText("25%");
        expect(percentTags).toHaveLength(4);
    });

    it("dominant item shows '99%' instead of '100%' when non-zero peers exist (Figma: no >99%)", () => {
        render(
            <BLIStatusSummaryCard
                totalAmount={1000}
                totalDraftAmount={996}
                totalPlannedAmount={2}
                totalExecutingAmount={1}
                totalObligatedAmount={1}
                titlePrefix="FY 2024"
            />
        );
        expect(screen.getByText("99%")).toBeInTheDocument();
        expect(screen.queryByText(">99%")).not.toBeInTheDocument();
        expect(screen.queryByText("100%")).not.toBeInTheDocument();
    });

    it("sub-1% non-zero items show '<1%' instead of '0%'", () => {
        render(
            <BLIStatusSummaryCard
                totalAmount={1000}
                totalDraftAmount={996}
                totalPlannedAmount={2}
                totalExecutingAmount={1}
                totalObligatedAmount={1}
                titlePrefix="FY 2024"
            />
        );
        const subOnePercent = screen.getAllByText("<1%");
        expect(subOnePercent.length).toBeGreaterThan(0);
    });

    it("zero-value items show '0%'", () => {
        render(
            <BLIStatusSummaryCard
                totalAmount={1000}
                totalDraftAmount={1000}
                totalPlannedAmount={0}
                totalExecutingAmount={0}
                totalObligatedAmount={0}
                titlePrefix="FY 2024"
            />
        );
        const zeroPercent = screen.getAllByText("0%");
        expect(zeroPercent).toHaveLength(3);
    });

    it("hides the donut chart when totalAmount is 0", () => {
        render(
            <BLIStatusSummaryCard
                totalAmount={0}
                totalDraftAmount={0}
                totalPlannedAmount={0}
                totalExecutingAmount={0}
                totalObligatedAmount={0}
                titlePrefix="FY 2024"
            />
        );
        expect(screen.queryByTestId("mock-donut")).not.toBeInTheDocument();
    });

    it("passes real legend values to the donut (arc flooring handled inside ResponsiveDonutWithInnerPercent)", () => {
        // Planned = 5 out of 1000 = 0.5% — below the 1% arc floor.
        // The component now passes real values to the donut; the donut applies
        // applyMinimumArcValue internally. The mock renders the raw value.
        render(
            <BLIStatusSummaryCard
                totalAmount={1000}
                totalDraftAmount={995}
                totalPlannedAmount={5}
                totalExecutingAmount={0}
                totalObligatedAmount={0}
                titlePrefix="FY 2024"
            />
        );
        // The mock donut shows the real value (5), not the floored chart value.
        const plannedSlice = screen.getByTestId("donut-slice-2");
        const sliceValue = parseFloat(plannedSlice.textContent.split(":")[1]);
        expect(sliceValue).toBe(5);
    });

    it("renders with undefined totalAmount gracefully (no crash)", () => {
        render(
            <BLIStatusSummaryCard
                totalDraftAmount={100}
                totalPlannedAmount={0}
                totalExecutingAmount={0}
                totalObligatedAmount={0}
                titlePrefix="FY 2024"
            />
        );
        expect(screen.getByText("FY 2024 Budget Lines By Status")).toBeInTheDocument();
    });
});
