import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProjectTypeSummaryCard from "./ProjectTypeSummaryCard";

vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent", () => ({
    default: ({ data }) => (
        <div
            data-testid="donut-chart"
            data-chart-values={JSON.stringify(data.map((d) => d.value))}
        />
    )
}));

vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent", () => ({
    default: () => () => null
}));

const testSummary = {
    total_projects: 15,
    projects_by_type: {
        RESEARCH: 13,
        ADMINISTRATIVE_AND_SUPPORT: 2
    },
    amounts_by_type: {
        RESEARCH: { amount: 7000000, percent: 70 },
        ADMINISTRATIVE_AND_SUPPORT: { amount: 3000000, percent: 30 }
    }
};

const tinySliceSummary = {
    amounts_by_type: {
        RESEARCH: { amount: 3557011799.2, percent: 100 },
        ADMINISTRATIVE_AND_SUPPORT: { amount: 301500, percent: 0 }
    }
};

describe("ProjectTypeSummaryCard", () => {
    it("renders the title", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={testSummary}
            />
        );
        expect(screen.getByText("FY 2025 Projects by Type")).toBeInTheDocument();
    });

    it("renders a legend item for each project type", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={testSummary}
            />
        );
        expect(screen.getByText("Research")).toBeInTheDocument();
        expect(screen.getByText("Admin & Support")).toBeInTheDocument();
    });

    it("renders dollar amounts for each type", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={testSummary}
            />
        );
        expect(screen.getByText("$7,000,000.00")).toBeInTheDocument();
        expect(screen.getByText("$3,000,000.00")).toBeInTheDocument();
    });

    it("renders percent tags for each type", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={testSummary}
            />
        );
        expect(screen.getByText("70%")).toBeInTheDocument();
        expect(screen.getByText("30%")).toBeInTheDocument();
    });

    it("shows <1% tag when a non-zero amount rounds down to 0%", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={tinySliceSummary}
            />
        );
        expect(screen.getByText("<1%")).toBeInTheDocument();
        expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("renders the donut chart when totalAmount > 0", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={testSummary}
            />
        );
        expect(screen.getByTestId("donut-chart")).toBeInTheDocument();
    });

    it("applies minimum arc value so tiny non-zero slices are visible in the chart", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={tinySliceSummary}
            />
        );
        const chart = screen.getByTestId("donut-chart");
        const chartValues = JSON.parse(chart.getAttribute("data-chart-values"));
        const researchAmount = tinySliceSummary.amounts_by_type.RESEARCH.amount;
        const adminAmount = tinySliceSummary.amounts_by_type.ADMINISTRATIVE_AND_SUPPORT.amount;
        const total = researchAmount + adminAmount;
        const minValue = total * 0.01;

        // Admin & Support real value (301500) is less than 1% of total — chart value should be floored to minValue
        expect(chartValues[1]).toBeCloseTo(minValue, 0);

        // Chart total should be preserved — sum of chart values equals the original total
        const chartTotal = chartValues[0] + chartValues[1];
        expect(chartTotal).toBeCloseTo(total, 0);

        // Research should be slightly reduced to compensate for the floored Admin & Support slice
        expect(chartValues[0]).toBeLessThan(researchAmount);
    });

    it("does not alter chart values when all slices are already above the minimum", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={testSummary}
            />
        );
        const chart = screen.getByTestId("donut-chart");
        const chartValues = JSON.parse(chart.getAttribute("data-chart-values"));
        expect(chartValues[0]).toBe(7000000);
        expect(chartValues[1]).toBe(3000000);
    });

    it("does not render the donut chart when all amounts are 0", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={{
                    amounts_by_type: {
                        RESEARCH: { amount: 0, percent: 0 },
                        ADMINISTRATIVE_AND_SUPPORT: { amount: 0, percent: 0 }
                    }
                }}
            />
        );
        expect(screen.queryByTestId("donut-chart")).not.toBeInTheDocument();
    });

    it("handles null summary gracefully", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={null}
            />
        );
        expect(screen.queryByTestId("donut-chart")).not.toBeInTheDocument();
    });

    it("handles undefined summary gracefully", () => {
        render(<ProjectTypeSummaryCard title="FY 2025 Projects by Type" />);
        expect(screen.queryByTestId("donut-chart")).not.toBeInTheDocument();
    });
});
