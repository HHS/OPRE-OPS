import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProcurementSummaryCards from "./ProcurementSummaryCards";

// Mock chart components that rely on D3/SVG rendering
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

vi.mock("../../components/UI/DataViz/LineBar", () => ({
    default: ({ title, total }) => (
        <div data-testid={`line-bar-${title}`}>
            {title}: {total}
        </div>
    )
}));

vi.mock("../../components/UI/DataViz/HorizontalStackedBar/HorizontalStackedBar", () => ({
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

const makeAgreement = (id, blis) => ({
    id,
    budget_line_items: blis
});

const makeBli = (status, amount, fees = 0, fiscalYear = 2025) => ({
    status,
    amount,
    fees,
    fiscal_year: fiscalYear
});

const makeTracker = (agreementId, stepNumber) => ({
    agreement_id: agreementId,
    active_step_number: stepNumber
});

describe("ProcurementSummaryCards", () => {
    const fiscalYear = 2025;

    it("step budget amounts sum to the executing total in the overview card", () => {
        const agreements = [
            makeAgreement(1, [
                makeBli("IN_EXECUTION", 100_000, 5_000),
                makeBli("PLANNED", 50_000) // not executing, excluded from steps
            ]),
            makeAgreement(2, [makeBli("IN_EXECUTION", 200_000, 10_000)]),
            makeAgreement(3, [makeBli("IN_EXECUTION", 75_000, 0), makeBli("IN_EXECUTION", 25_000, 0)])
        ];

        const trackers = [makeTracker(1, 2), makeTracker(2, 4), makeTracker(3, 2)];

        render(
            <ProcurementSummaryCards
                agreements={agreements}
                procurementTrackers={trackers}
                fiscalYear={fiscalYear}
            />
        );

        // Executing totals per agreement (amount + fees):
        //   Agreement 1: 100k + 5k = 105k (Step 2)
        //   Agreement 2: 200k + 10k = 210k (Step 4)
        //   Agreement 3: 75k + 25k = 100k (Step 2)
        // Step 2 total: 105k + 100k = 205k
        // Step 4 total: 210k
        // Sum of all steps: 205k + 210k = 415k

        // The overview card should show executing amount = 415k
        const executingValueContainers = screen.getAllByTestId("value-container");
        // Overview card shows [Planned, Executing, Obligated] via LegendItem
        // Planned = 50k, Executing = 415k, Obligated = 0
        expect(executingValueContainers[1]).toHaveTextContent("$415,000.00");

        // The line bars show budget by step
        const step2Bar = screen.getByTestId("line-bar-Step 2");
        const step4Bar = screen.getByTestId("line-bar-Step 4");
        expect(step2Bar).toHaveTextContent("205000");
        expect(step4Bar).toHaveTextContent("210000");

        // Verify: sum of step budgets = executing total
        // Step 1-6 totals from line bars
        const stepTotals = [1, 2, 3, 4, 5, 6].map((step) => {
            const bar = screen.getByTestId(`line-bar-Step ${step}`);
            const match = bar.textContent.match(/Step \d+: (\d+)/);
            return match ? Number(match[1]) : 0;
        });
        const sumOfSteps = stepTotals.reduce((sum, val) => sum + val, 0);
        expect(sumOfSteps).toBe(415_000);
    });

    it("only counts executing BLIs for step data, not planned or obligated", () => {
        const agreements = [
            makeAgreement(1, [
                makeBli("PLANNED", 500_000),
                makeBli("IN_EXECUTION", 100_000),
                makeBli("OBLIGATED", 200_000)
            ])
        ];

        const trackers = [makeTracker(1, 3)];

        render(
            <ProcurementSummaryCards
                agreements={agreements}
                procurementTrackers={trackers}
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
        const agreements = [
            makeAgreement(1, [makeBli("IN_EXECUTION", 100_000)]),
            makeAgreement(2, [makeBli("IN_EXECUTION", 200_000)])
        ];

        // Only agreement 1 has a tracker; agreement 2 has no tracker
        const trackers = [makeTracker(1, 1)];

        render(
            <ProcurementSummaryCards
                agreements={agreements}
                procurementTrackers={trackers}
                fiscalYear={fiscalYear}
            />
        );

        // Only agreement 1's 100k should appear in steps
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
        const agreements = [makeAgreement(1, [makeBli("PLANNED", 500_000)])];

        const trackers = [makeTracker(1, 1)];

        render(
            <ProcurementSummaryCards
                agreements={agreements}
                procurementTrackers={trackers}
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
        const agreements = [
            makeAgreement(1, [makeBli("IN_EXECUTION", 50_000)]),
            makeAgreement(2, [makeBli("IN_EXECUTION", 75_000)]),
            makeAgreement(3, [makeBli("IN_EXECUTION", 25_000)])
        ];

        const trackers = [makeTracker(1, 1), makeTracker(2, 1), makeTracker(3, 5)];

        render(
            <ProcurementSummaryCards
                agreements={agreements}
                procurementTrackers={trackers}
                fiscalYear={fiscalYear}
            />
        );

        // Step 1: 2 agreements, Step 5: 1 agreement = 3 total
        // Donut shows agreement counts
        const step1Slice = screen.getByTestId("donut-slice-1");
        expect(step1Slice).toHaveTextContent("Step 1: 2");

        const step5Slice = screen.getByTestId("donut-slice-5");
        expect(step5Slice).toHaveTextContent("Step 5: 1");
    });

    it("step percentages are based on agreement counts", () => {
        const agreements = [
            makeAgreement(1, [makeBli("IN_EXECUTION", 50_000)]),
            makeAgreement(2, [makeBli("IN_EXECUTION", 75_000)]),
            makeAgreement(3, [makeBli("IN_EXECUTION", 100_000)]),
            makeAgreement(4, [makeBli("IN_EXECUTION", 25_000)])
        ];

        const trackers = [makeTracker(1, 2), makeTracker(2, 2), makeTracker(3, 2), makeTracker(4, 6)];

        render(
            <ProcurementSummaryCards
                agreements={agreements}
                procurementTrackers={trackers}
                fiscalYear={fiscalYear}
            />
        );

        // Step 2: 3/4 = 75%, Step 6: 1/4 = 25%
        // StepLegendItem renders percent as text via Tag
        expect(screen.getByText("75%")).toBeInTheDocument();
        expect(screen.getByText("25%")).toBeInTheDocument();
    });

    it("handles empty agreements and trackers", () => {
        render(
            <ProcurementSummaryCards
                agreements={[]}
                procurementTrackers={[]}
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
        const agreements = [
            makeAgreement(1, [
                makeBli("IN_EXECUTION", 100_000, 0, 2025),
                makeBli("IN_EXECUTION", 999_999, 0, 2024) // wrong FY
            ])
        ];

        const trackers = [makeTracker(1, 3)];

        render(
            <ProcurementSummaryCards
                agreements={agreements}
                procurementTrackers={trackers}
                fiscalYear={fiscalYear}
            />
        );

        const step3Bar = screen.getByTestId("line-bar-Step 3");
        expect(step3Bar).toHaveTextContent("100000");
    });

    it("cross-validates: step budget totals equal overview executing amount with fees", () => {
        // More complex scenario with multiple agreements, steps, and fees
        const agreements = [
            makeAgreement(10, [
                makeBli("IN_EXECUTION", 300_000, 15_000), // 315k
                makeBli("PLANNED", 100_000, 5_000) // not in steps
            ]),
            makeAgreement(20, [
                makeBli("IN_EXECUTION", 150_000, 7_500), // 157.5k
                makeBli("IN_EXECUTION", 50_000, 2_500) // 52.5k
            ]),
            makeAgreement(30, [
                makeBli("IN_EXECUTION", 200_000, 0), // 200k
                makeBli("OBLIGATED", 80_000, 0) // not in steps
            ])
        ];

        const trackers = [makeTracker(10, 1), makeTracker(20, 3), makeTracker(30, 6)];

        render(
            <ProcurementSummaryCards
                agreements={agreements}
                procurementTrackers={trackers}
                fiscalYear={fiscalYear}
            />
        );

        // Expected executing amounts:
        //   Agreement 10: 315k (Step 1)
        //   Agreement 20: 157.5k + 52.5k = 210k (Step 3)
        //   Agreement 30: 200k (Step 6)
        //   Total executing: 315k + 210k + 200k = 725k

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
