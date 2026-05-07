import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProcurementStepSummaryCard from "./ProcurementStepSummaryCard";

vi.mock("../../components/UI/DataViz/ResponsiveDonutWithInnerPercent", () => ({
    default: ({ data }) => (
        <div data-testid="donut-chart">
            {data.map((d) => (
                <span
                    key={d.id}
                    data-testid={`donut-slice-${d.id}`}
                >
                    {d.label}: {d.value}
                </span>
            ))}
        </div>
    )
}));

vi.mock("../../components/UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent", () => ({
    default: () => () => null
}));

const makeStepData = (values) =>
    values.map((value, i) => ({
        id: i + 1,
        label: `Step ${i + 1}`,
        color: `var(--procurement-step-${i + 1})`,
        value,
        percent: 0
    }));

describe("ProcurementStepSummaryCard", () => {
    const fiscalYear = 2025;

    it("renders the title with fiscal year", () => {
        render(
            <ProcurementStepSummaryCard
                stepData={makeStepData([0, 0, 0, 0, 0, 0])}
                fiscalYear={fiscalYear}
            />
        );
        expect(screen.getByText("FY 2025 Agreements by Procurement Step")).toBeInTheDocument();
    });

    it("renders all six step legend items", () => {
        render(
            <ProcurementStepSummaryCard
                stepData={makeStepData([3, 2, 1, 0, 0, 0])}
                fiscalYear={fiscalYear}
            />
        );

        for (let i = 1; i <= 6; i++) {
            expect(screen.getByText(`Step ${i}`)).toBeInTheDocument();
        }
    });

    it("displays correct agreement counts per step", () => {
        const stepData = [
            { id: 1, label: "Step 1", color: "red", value: 5, percent: 50 },
            { id: 2, label: "Step 2", color: "blue", value: 3, percent: 30 },
            { id: 3, label: "Step 3", color: "green", value: 2, percent: 20 },
            { id: 4, label: "Step 4", color: "orange", value: 0, percent: 0 },
            { id: 5, label: "Step 5", color: "purple", value: 0, percent: 0 },
            { id: 6, label: "Step 6", color: "gray", value: 0, percent: 0 }
        ];

        render(
            <ProcurementStepSummaryCard
                stepData={stepData}
                fiscalYear={fiscalYear}
            />
        );

        // StepLegendItem renders value as text content
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("displays correct percentages per step", () => {
        const stepData = [
            { id: 1, label: "Step 1", color: "red", value: 5, percent: 50 },
            { id: 2, label: "Step 2", color: "blue", value: 3, percent: 30 },
            { id: 3, label: "Step 3", color: "green", value: 2, percent: 20 },
            { id: 4, label: "Step 4", color: "orange", value: 0, percent: 0 },
            { id: 5, label: "Step 5", color: "purple", value: 0, percent: 0 },
            { id: 6, label: "Step 6", color: "gray", value: 0, percent: 0 }
        ];

        render(
            <ProcurementStepSummaryCard
                stepData={stepData}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByText("50%")).toBeInTheDocument();
        expect(screen.getByText("30%")).toBeInTheDocument();
        expect(screen.getByText("20%")).toBeInTheDocument();
    });

    it("renders the donut chart with step data", () => {
        const stepData = makeStepData([2, 1, 0, 0, 0, 0]);

        render(
            <ProcurementStepSummaryCard
                stepData={stepData}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByTestId("donut-chart")).toBeInTheDocument();
        expect(screen.getByTestId("donut-slice-1")).toHaveTextContent("Step 1: 2");
        expect(screen.getByTestId("donut-slice-2")).toHaveTextContent("Step 2: 1");
    });

    it("handles all-zero step data", () => {
        render(
            <ProcurementStepSummaryCard
                stepData={makeStepData([0, 0, 0, 0, 0, 0])}
                fiscalYear={fiscalYear}
            />
        );

        // All steps should show 0 count and 0%
        const zeroPercents = screen.getAllByText("0%");
        expect(zeroPercents).toHaveLength(6);
    });
});
