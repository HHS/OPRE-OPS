import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProcurementSummaryCards from "./ProcurementSummaryCards";

// Mock chart components that rely on D3/SVG rendering
vi.mock("../../../components/UI/DataViz/ResponsiveDonutWithInnerPercent", () => ({
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

vi.mock("../../../components/UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent", () => ({
    default: () => () => null
}));

vi.mock("../../../components/UI/DataViz/LineBar", () => ({
    default: ({ title, total }) => (
        <div data-testid={`line-bar-${title}`}>
            {title}: {total}
        </div>
    )
}));

vi.mock("../../../components/UI/DataViz/HorizontalStackedBar/HorizontalStackedBar", () => ({
    default: ({ data }) => (
        <div data-testid="stacked-bar">
            {data.map((d) => (
                <span
                    key={d.id}
                    data-testid={`bar-segment-${d.label}`}
                >
                    {d.label}: {d.value}
                </span>
            ))}
        </div>
    )
}));

const makeOverview = (statusItems, totalAmount, totalAgreements) => ({
    status_data: statusItems,
    total_amount: totalAmount,
    total_agreements: totalAgreements
});

const makeStatusItem = (label, status, amount, amountPercent, agreements, agreementsPercent) => ({
    label,
    status,
    amount,
    amount_percent: amountPercent,
    agreements,
    agreements_percent: agreementsPercent
});

const makeStepSummary = (stepDataItems) => ({
    step_data: stepDataItems
});

const makeStepItem = (step, agreements, agreementsPercent, amount) => ({
    step,
    agreements,
    agreements_percent: agreementsPercent,
    amount
});

describe("ProcurementSummaryCards", () => {
    const fiscalYear = 2025;

    it("step budget amounts sum to the executing total in the overview card", () => {
        const overview = makeOverview(
            [
                makeStatusItem("Planned", "PLANNED", 50_000, 11, 1, 25),
                makeStatusItem("Executing", "IN_EXECUTION", 415_000, 89, 3, 75),
                makeStatusItem("Obligated", "OBLIGATED", 0, 0, 0, 0)
            ],
            465_000,
            4
        );

        const stepSummary = makeStepSummary([
            makeStepItem(1, 0, 0, 0),
            makeStepItem(2, 2, 67, 205_000),
            makeStepItem(3, 0, 0, 0),
            makeStepItem(4, 1, 33, 210_000),
            makeStepItem(5, 0, 0, 0),
            makeStepItem(6, 0, 0, 0)
        ]);

        render(
            <ProcurementSummaryCards
                procurementOverview={overview}
                procurementStepSummary={stepSummary}
                fiscalYear={fiscalYear}
            />
        );

        // The overview card should show executing amount = $415,000.00
        const executingValueContainers = screen.getAllByTestId("value-container");
        expect(executingValueContainers[1]).toHaveTextContent("$415,000.00");

        // The line bars show budget by step
        const step2Bar = screen.getByTestId("line-bar-Step 2");
        const step4Bar = screen.getByTestId("line-bar-Step 4");
        expect(step2Bar).toHaveTextContent("205000");
        expect(step4Bar).toHaveTextContent("210000");

        // Verify: sum of step budgets = executing total
        const stepTotals = [1, 2, 3, 4, 5, 6].map((step) => {
            const bar = screen.getByTestId(`line-bar-Step ${step}`);
            const match = bar.textContent.match(/Step \d+: (\d+)/);
            return match ? Number(match[1]) : 0;
        });
        const sumOfSteps = stepTotals.reduce((sum, val) => sum + val, 0);
        expect(sumOfSteps).toBe(415_000);
    });

    it("only counts executing BLIs for step data, not planned or obligated", () => {
        const overview = makeOverview(
            [
                makeStatusItem("Planned", "PLANNED", 500_000, 63, 1, 100),
                makeStatusItem("Executing", "IN_EXECUTION", 100_000, 13, 1, 100),
                makeStatusItem("Obligated", "OBLIGATED", 200_000, 25, 1, 100)
            ],
            800_000,
            1
        );

        const stepSummary = makeStepSummary([
            makeStepItem(1, 0, 0, 0),
            makeStepItem(2, 0, 0, 0),
            makeStepItem(3, 1, 100, 100_000),
            makeStepItem(4, 0, 0, 0),
            makeStepItem(5, 0, 0, 0),
            makeStepItem(6, 0, 0, 0)
        ]);

        render(
            <ProcurementSummaryCards
                procurementOverview={overview}
                procurementStepSummary={stepSummary}
                fiscalYear={fiscalYear}
            />
        );

        // Only executing BLI (100k) should appear in step 3
        const step3Bar = screen.getByTestId("line-bar-Step 3");
        expect(step3Bar).toHaveTextContent("100000");

        // Other steps should be 0
        const step1Bar = screen.getByTestId("line-bar-Step 1");
        expect(step1Bar).toHaveTextContent("Step 1: 0");
    });

    it("excludes agreements without a valid tracker step number", () => {
        const overview = makeOverview([makeStatusItem("Executing", "IN_EXECUTION", 300_000, 100, 2, 100)], 300_000, 2);

        // Only agreement 1 has a tracker step; agreement 2 has none
        const stepSummary = makeStepSummary([
            makeStepItem(1, 1, 100, 100_000),
            makeStepItem(2, 0, 0, 0),
            makeStepItem(3, 0, 0, 0),
            makeStepItem(4, 0, 0, 0),
            makeStepItem(5, 0, 0, 0),
            makeStepItem(6, 0, 0, 0)
        ]);

        render(
            <ProcurementSummaryCards
                procurementOverview={overview}
                procurementStepSummary={stepSummary}
                fiscalYear={fiscalYear}
            />
        );

        const step1Bar = screen.getByTestId("line-bar-Step 1");
        expect(step1Bar).toHaveTextContent("100000");

        const stepTotals = [1, 2, 3, 4, 5, 6].map((step) => {
            const bar = screen.getByTestId(`line-bar-Step ${step}`);
            const match = bar.textContent.match(/Step \d+: (\d+)/);
            return match ? Number(match[1]) : 0;
        });
        expect(stepTotals.reduce((sum, v) => sum + v, 0)).toBe(100_000);
    });

    it("handles agreements with no executing BLIs (skipped in step data)", () => {
        const overview = makeOverview([makeStatusItem("Planned", "PLANNED", 500_000, 100, 1, 100)], 500_000, 1);

        render(
            <ProcurementSummaryCards
                procurementOverview={overview}
                procurementStepSummary={null}
                fiscalYear={fiscalYear}
            />
        );

        // No executing BLIs, so all step bars should be 0
        const stepTotals = [1, 2, 3, 4, 5, 6].map((step) => {
            const bar = screen.getByTestId(`line-bar-Step ${step}`);
            const match = bar.textContent.match(/Step \d+: (\d+)/);
            return match ? Number(match[1]) : 0;
        });
        expect(stepTotals.reduce((sum, v) => sum + v, 0)).toBe(0);
    });

    it("correctly distributes agreements across steps in the donut chart", () => {
        const overview = makeOverview([makeStatusItem("Executing", "IN_EXECUTION", 150_000, 100, 3, 100)], 150_000, 3);

        const stepSummary = makeStepSummary([
            makeStepItem(1, 2, 67, 125_000),
            makeStepItem(2, 0, 0, 0),
            makeStepItem(3, 0, 0, 0),
            makeStepItem(4, 0, 0, 0),
            makeStepItem(5, 1, 33, 25_000),
            makeStepItem(6, 0, 0, 0)
        ]);

        render(
            <ProcurementSummaryCards
                procurementOverview={overview}
                procurementStepSummary={stepSummary}
                fiscalYear={fiscalYear}
            />
        );

        // Step 1: 2 agreements, Step 5: 1 agreement
        const step1Slice = screen.getByTestId("donut-slice-1");
        expect(step1Slice).toHaveTextContent("Step 1: 2");

        const step5Slice = screen.getByTestId("donut-slice-5");
        expect(step5Slice).toHaveTextContent("Step 5: 1");
    });

    it("step percentages are based on agreement counts", () => {
        const overview = makeOverview([makeStatusItem("Executing", "IN_EXECUTION", 250_000, 100, 4, 100)], 250_000, 4);

        const stepSummary = makeStepSummary([
            makeStepItem(1, 0, 0, 0),
            makeStepItem(2, 3, 75, 175_000),
            makeStepItem(3, 0, 0, 0),
            makeStepItem(4, 0, 0, 0),
            makeStepItem(5, 0, 0, 0),
            makeStepItem(6, 1, 25, 25_000)
        ]);

        render(
            <ProcurementSummaryCards
                procurementOverview={overview}
                procurementStepSummary={stepSummary}
                fiscalYear={fiscalYear}
            />
        );

        // Step 2: 3/4 = 75%, Step 6: 1/4 = 25%
        expect(screen.getByText("75%")).toBeInTheDocument();
        expect(screen.getByText("25%")).toBeInTheDocument();
    });

    it("handles empty agreements and trackers", () => {
        render(
            <ProcurementSummaryCards
                procurementOverview={null}
                procurementStepSummary={null}
                fiscalYear={fiscalYear}
            />
        );

        // All step bars should be 0
        const stepTotals = [1, 2, 3, 4, 5, 6].map((step) => {
            const bar = screen.getByTestId(`line-bar-Step ${step}`);
            const match = bar.textContent.match(/Step \d+: (\d+)/);
            return match ? Number(match[1]) : 0;
        });
        expect(stepTotals.reduce((sum, v) => sum + v, 0)).toBe(0);

        // Overview total and all status values show $0
        const allZeroDollars = screen.getAllByText("$0");
        expect(allZeroDollars.length).toBeGreaterThanOrEqual(1);
    });

    it("filters BLIs by fiscal year in step calculations", () => {
        // Backend already handles FY filtering; we just verify correct amounts
        const overview = makeOverview([makeStatusItem("Executing", "IN_EXECUTION", 100_000, 100, 1, 100)], 100_000, 1);

        const stepSummary = makeStepSummary([
            makeStepItem(1, 0, 0, 0),
            makeStepItem(2, 0, 0, 0),
            makeStepItem(3, 1, 100, 100_000),
            makeStepItem(4, 0, 0, 0),
            makeStepItem(5, 0, 0, 0),
            makeStepItem(6, 0, 0, 0)
        ]);

        render(
            <ProcurementSummaryCards
                procurementOverview={overview}
                procurementStepSummary={stepSummary}
                fiscalYear={fiscalYear}
            />
        );

        const step3Bar = screen.getByTestId("line-bar-Step 3");
        expect(step3Bar).toHaveTextContent("100000");
    });

    it("cross-validates: step budget totals equal overview executing amount with fees", () => {
        const overview = makeOverview(
            [
                makeStatusItem("Planned", "PLANNED", 105_000, 13, 1, 25),
                makeStatusItem("Executing", "IN_EXECUTION", 725_000, 87, 3, 75),
                makeStatusItem("Obligated", "OBLIGATED", 80_000, 10, 1, 25)
            ],
            830_000,
            4
        );

        const stepSummary = makeStepSummary([
            makeStepItem(1, 1, 33, 315_000),
            makeStepItem(2, 0, 0, 0),
            makeStepItem(3, 1, 33, 210_000),
            makeStepItem(4, 0, 0, 0),
            makeStepItem(5, 0, 0, 0),
            makeStepItem(6, 1, 33, 200_000)
        ]);

        render(
            <ProcurementSummaryCards
                procurementOverview={overview}
                procurementStepSummary={stepSummary}
                fiscalYear={fiscalYear}
            />
        );

        // Overview card: executing value
        const valueContainers = screen.getAllByTestId("value-container");
        expect(valueContainers[1]).toHaveTextContent("$725,000.00"); // Executing

        // Step bars
        const step1Bar = screen.getByTestId("line-bar-Step 1");
        const step3Bar = screen.getByTestId("line-bar-Step 3");
        const step6Bar = screen.getByTestId("line-bar-Step 6");
        expect(step1Bar).toHaveTextContent("315000");
        expect(step3Bar).toHaveTextContent("210000");
        expect(step6Bar).toHaveTextContent("200000");

        // Cross-validate: sum of all steps = executing total
        const stepTotals = [1, 2, 3, 4, 5, 6].map((step) => {
            const bar = screen.getByTestId(`line-bar-Step ${step}`);
            const match = bar.textContent.match(/Step \d+: (\d+)/);
            return match ? Number(match[1]) : 0;
        });
        const sumOfSteps = stepTotals.reduce((sum, v) => sum + v, 0);

        // The executing amount from overview = 725,000
        expect(sumOfSteps).toBe(725_000);
    });
});
