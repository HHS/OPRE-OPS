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

    it("shows '<1%' for tiny non-zero peer and '>99%' for the dominant type", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={tinySliceSummary}
            />
        );
        expect(screen.getByText("<1%")).toBeInTheDocument();
        expect(screen.getByText(">99%")).toBeInTheDocument();
        expect(screen.queryByText("100%")).not.toBeInTheDocument();
    });

    it("dominant type shows '>99%' when non-zero peers exist", () => {
        render(
            <ProjectTypeSummaryCard
                title="FY 2025 Projects by Type"
                summary={{
                    amounts_by_type: {
                        RESEARCH: { amount: 9960 },
                        ADMINISTRATIVE_AND_SUPPORT: { amount: 40 }
                    }
                }}
            />
        );
        expect(screen.getByText(">99%")).toBeInTheDocument();
        expect(screen.queryByText("100%")).not.toBeInTheDocument();
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

    it("passes real values to the donut chart (arc flooring now handled inside ResponsiveDonutWithInnerPercent)", () => {
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

        // Component now passes real values; donut floors internally.
        expect(chartValues[0]).toBe(researchAmount);
        expect(chartValues[1]).toBe(adminAmount);
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
        // Real values passed through unchanged — component no longer floors locally
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
