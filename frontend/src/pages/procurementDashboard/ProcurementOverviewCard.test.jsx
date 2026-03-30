import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProcurementOverviewCard from "./ProcurementOverviewCard";

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

describe("ProcurementOverviewCard", () => {
    const fiscalYear = 2025;

    it("renders loading state", () => {
        render(
            <ProcurementOverviewCard
                agreements={[]}
                fiscalYear={fiscalYear}
                isLoading={true}
            />
        );
        expect(screen.getByText("Loading procurement overview...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        render(
            <ProcurementOverviewCard
                agreements={[]}
                fiscalYear={fiscalYear}
                error={{ message: "fail" }}
            />
        );
        expect(screen.getByText("Error loading procurement data.")).toBeInTheDocument();
    });

    it("computes correct total amount across all statuses", () => {
        const agreements = [
            makeAgreement(1, [
                makeBli("PLANNED", 100_000),
                makeBli("IN_EXECUTION", 200_000),
                makeBli("OBLIGATED", 50_000)
            ])
        ];

        render(
            <ProcurementOverviewCard
                agreements={agreements}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByText("$350,000")).toBeInTheDocument();
    });

    it("includes fees in the amount calculations", () => {
        const agreements = [makeAgreement(1, [makeBli("IN_EXECUTION", 100_000, 5_000)])];

        render(
            <ProcurementOverviewCard
                agreements={agreements}
                fiscalYear={fiscalYear}
            />
        );

        // Total should be amount + fees = 105,000
        expect(screen.getByText("$105,000")).toBeInTheDocument();
    });

    it("filters BLIs by fiscal year", () => {
        const agreements = [
            makeAgreement(1, [
                makeBli("IN_EXECUTION", 100_000, 0, 2025),
                makeBli("IN_EXECUTION", 999_999, 0, 2024) // different FY, should be excluded
            ])
        ];

        render(
            <ProcurementOverviewCard
                agreements={agreements}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByText("$100,000")).toBeInTheDocument();
    });

    it("displays correct agreement count", () => {
        const agreements = [
            makeAgreement(1, [makeBli("PLANNED", 50_000)]),
            makeAgreement(2, [makeBli("IN_EXECUTION", 75_000)]),
            makeAgreement(3, [makeBli("OBLIGATED", 25_000)])
        ];

        render(
            <ProcurementOverviewCard
                agreements={agreements}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByText("3 agreements")).toBeInTheDocument();
    });

    it("computes correct dollar amounts per status", () => {
        const agreements = [
            makeAgreement(1, [
                makeBli("PLANNED", 100_000),
                makeBli("IN_EXECUTION", 200_000),
                makeBli("OBLIGATED", 300_000)
            ]),
            makeAgreement(2, [makeBli("PLANNED", 50_000), makeBli("IN_EXECUTION", 100_000)])
        ];

        render(
            <ProcurementOverviewCard
                agreements={agreements}
                fiscalYear={fiscalYear}
            />
        );

        // Planned: 100k + 50k = 150k
        // Executing: 200k + 100k = 300k
        // Obligated: 300k
        // Total: 750k
        const valueContainers = screen.getAllByTestId("value-container");
        expect(valueContainers).toHaveLength(3);
        expect(valueContainers[0]).toHaveTextContent("$150,000.00"); // Planned
        expect(valueContainers[1]).toHaveTextContent("$300,000.00"); // Executing
        expect(valueContainers[2]).toHaveTextContent("$300,000.00"); // Obligated
    });

    it("computes correct percentages per status", () => {
        const agreements = [
            makeAgreement(1, [
                makeBli("PLANNED", 250_000),
                makeBli("IN_EXECUTION", 500_000),
                makeBli("OBLIGATED", 250_000)
            ])
        ];

        render(
            <ProcurementOverviewCard
                agreements={agreements}
                fiscalYear={fiscalYear}
            />
        );

        // Planned: 250k/1M = 25%, Executing: 500k/1M = 50%, Obligated: 250k/1M = 25%
        const legendTags = screen.getAllByTestId("legend-tag");
        expect(legendTags).toHaveLength(3);
        expect(legendTags[0]).toHaveTextContent("25%");
        expect(legendTags[1]).toHaveTextContent("50%");
        expect(legendTags[2]).toHaveTextContent("25%");
    });

    it("counts agreements per status correctly (an agreement can appear in multiple statuses)", () => {
        const agreements = [
            makeAgreement(1, [makeBli("PLANNED", 100_000), makeBli("IN_EXECUTION", 200_000)]),
            makeAgreement(2, [makeBli("PLANNED", 50_000)]),
            makeAgreement(3, [makeBli("OBLIGATED", 75_000)])
        ];

        render(
            <ProcurementOverviewCard
                agreements={agreements}
                fiscalYear={fiscalYear}
            />
        );

        // Planned agreements: {1, 2} = 2, Executing: {1} = 1, Obligated: {3} = 1
        // Agreement counts show as "X agreements" text within each legend section
        const agreementTexts = screen.getAllByText(/\d+ agreement/);
        // Total "3 agreements" + per-status: "2 agreements", "1 agreements", "1 agreements"
        expect(agreementTexts).toHaveLength(4);
    });

    it("handles empty agreements list", () => {
        render(
            <ProcurementOverviewCard
                agreements={[]}
                fiscalYear={fiscalYear}
            />
        );

        // Total amount header shows $0
        const allZeroDollars = screen.getAllByText("$0");
        expect(allZeroDollars.length).toBeGreaterThanOrEqual(1);

        // All three status values should be $0
        const valueContainers = screen.getAllByTestId("value-container");
        expect(valueContainers).toHaveLength(3);
        valueContainers.forEach((el) => expect(el).toHaveTextContent("$0"));

        // Total header + 3 per-status = multiple "0 agreements" elements
        const agreementTexts = screen.getAllByText(/0 agreements/);
        expect(agreementTexts.length).toBeGreaterThanOrEqual(1);
    });

    it("ignores BLIs with statuses not in the tracked set (e.g. DRAFT)", () => {
        const agreements = [makeAgreement(1, [makeBli("DRAFT", 999_999), makeBli("IN_EXECUTION", 100_000)])];

        render(
            <ProcurementOverviewCard
                agreements={agreements}
                fiscalYear={fiscalYear}
            />
        );

        // Only executing amount should count toward total
        expect(screen.getByText("$100,000")).toBeInTheDocument();
    });
});
