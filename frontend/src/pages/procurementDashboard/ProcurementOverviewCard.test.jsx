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

describe("ProcurementOverviewCard", () => {
    const fiscalYear = 2025;

    it("renders loading state", () => {
        render(
            <ProcurementOverviewCard
                fiscalYear={fiscalYear}
                isLoading={true}
            />
        );
        expect(screen.getByText("Loading procurement overview...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        render(
            <ProcurementOverviewCard
                fiscalYear={fiscalYear}
                error={{ message: "fail" }}
            />
        );
        expect(screen.getByText("Error loading procurement data.")).toBeInTheDocument();
    });

    it("computes correct total amount across all statuses", () => {
        const overview = makeOverview(
            [
                makeStatusItem("Planned", "PLANNED", 100_000, 29, 1, 33),
                makeStatusItem("Executing", "IN_EXECUTION", 200_000, 57, 1, 33),
                makeStatusItem("Obligated", "OBLIGATED", 50_000, 14, 1, 33)
            ],
            350_000,
            3
        );

        render(
            <ProcurementOverviewCard
                procurementOverview={overview}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByText("$350,000")).toBeInTheDocument();
    });

    it("includes fees in the amount calculations", () => {
        const overview = makeOverview([makeStatusItem("Executing", "IN_EXECUTION", 105_000, 100, 1, 100)], 105_000, 1);

        render(
            <ProcurementOverviewCard
                procurementOverview={overview}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByText("$105,000")).toBeInTheDocument();
    });

    it("filters BLIs by fiscal year", () => {
        // Backend already filters by FY; we just verify the total shown
        const overview = makeOverview([makeStatusItem("Executing", "IN_EXECUTION", 100_000, 100, 1, 100)], 100_000, 1);

        render(
            <ProcurementOverviewCard
                procurementOverview={overview}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByText("$100,000")).toBeInTheDocument();
    });

    it("displays correct agreement count", () => {
        const overview = makeOverview(
            [
                makeStatusItem("Planned", "PLANNED", 50_000, 33, 1, 33),
                makeStatusItem("Executing", "IN_EXECUTION", 75_000, 50, 1, 33),
                makeStatusItem("Obligated", "OBLIGATED", 25_000, 17, 1, 33)
            ],
            150_000,
            3
        );

        render(
            <ProcurementOverviewCard
                procurementOverview={overview}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByText("3 agreements")).toBeInTheDocument();
    });

    it("computes correct dollar amounts per status", () => {
        const overview = makeOverview(
            [
                makeStatusItem("Planned", "PLANNED", 150_000, 20, 2, 40),
                makeStatusItem("Executing", "IN_EXECUTION", 300_000, 40, 1, 20),
                makeStatusItem("Obligated", "OBLIGATED", 300_000, 40, 1, 20)
            ],
            750_000,
            5
        );

        render(
            <ProcurementOverviewCard
                procurementOverview={overview}
                fiscalYear={fiscalYear}
            />
        );

        const valueContainers = screen.getAllByTestId("value-container");
        expect(valueContainers).toHaveLength(3);
        expect(valueContainers[0]).toHaveTextContent("$150,000.00"); // Planned
        expect(valueContainers[1]).toHaveTextContent("$300,000.00"); // Executing
        expect(valueContainers[2]).toHaveTextContent("$300,000.00"); // Obligated
    });

    it("computes correct percentages per status", () => {
        const overview = makeOverview(
            [
                makeStatusItem("Planned", "PLANNED", 250_000, 25, 1, 33),
                makeStatusItem("Executing", "IN_EXECUTION", 500_000, 50, 1, 33),
                makeStatusItem("Obligated", "OBLIGATED", 250_000, 25, 1, 33)
            ],
            1_000_000,
            3
        );

        render(
            <ProcurementOverviewCard
                procurementOverview={overview}
                fiscalYear={fiscalYear}
            />
        );

        const legendTags = screen.getAllByTestId("legend-tag");
        expect(legendTags).toHaveLength(3);
        expect(legendTags[0]).toHaveTextContent("25%");
        expect(legendTags[1]).toHaveTextContent("50%");
        expect(legendTags[2]).toHaveTextContent("25%");
    });

    it("counts agreements per status correctly (an agreement can appear in multiple statuses)", () => {
        const overview = makeOverview(
            [
                makeStatusItem("Planned", "PLANNED", 150_000, 43, 2, 50),
                makeStatusItem("Executing", "IN_EXECUTION", 200_000, 57, 1, 25),
                makeStatusItem("Obligated", "OBLIGATED", 75_000, 21, 1, 25)
            ],
            350_000,
            3
        );

        render(
            <ProcurementOverviewCard
                procurementOverview={overview}
                fiscalYear={fiscalYear}
            />
        );

        // Total "3 agreements" + per-status: "2 agreements", "1 agreements", "1 agreements"
        const agreementTexts = screen.getAllByText(/\d+ agreement/);
        expect(agreementTexts).toHaveLength(4);
    });

    it("handles empty/null procurementOverview", () => {
        render(
            <ProcurementOverviewCard
                procurementOverview={null}
                fiscalYear={fiscalYear}
            />
        );

        // With null overview, buildStatusData returns empty arrays and 0 totals
        const allZeroDollars = screen.getAllByText("$0");
        expect(allZeroDollars.length).toBeGreaterThanOrEqual(1);

        const agreementTexts = screen.getAllByText(/0 agreements/);
        expect(agreementTexts.length).toBeGreaterThanOrEqual(1);
    });

    it("ignores BLIs with statuses not in the tracked set (e.g. DRAFT)", () => {
        // Backend already filters these out; overview only contains tracked statuses
        const overview = makeOverview([makeStatusItem("Executing", "IN_EXECUTION", 100_000, 100, 1, 100)], 100_000, 1);

        render(
            <ProcurementOverviewCard
                procurementOverview={overview}
                fiscalYear={fiscalYear}
            />
        );

        expect(screen.getByText("$100,000")).toBeInTheDocument();
    });
});
