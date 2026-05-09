import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AgreementSpendingSummaryCard from "./AgreementSpendingSummaryCard";

// Mock the donut chart since it relies on D3/SVG rendering
vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent", () => ({
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

vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent", () => ({
    default: () => () => null
}));

describe("AgreementSpendingSummaryCard", () => {
    const defaultProps = {
        titlePrefix: "2025",
        contractTotal: 500_000,
        partnerTotal: 200_000,
        grantTotal: 150_000,
        directObligationTotal: 150_000
    };

    it("renders the spending by agreement type title", () => {
        render(<AgreementSpendingSummaryCard {...defaultProps} />);
        expect(screen.getByText("2025 Spending by Agreement Type")).toBeInTheDocument();
    });

    it("renders all four legend labels", () => {
        render(<AgreementSpendingSummaryCard {...defaultProps} />);
        expect(screen.getByText("Contract")).toBeInTheDocument();
        expect(screen.getByText("Partner")).toBeInTheDocument();
        expect(screen.getByText("Grant")).toBeInTheDocument();
        expect(screen.getByText("Direct Obligation")).toBeInTheDocument();
    });

    it("computes and displays correct percentages dynamically", () => {
        render(<AgreementSpendingSummaryCard {...defaultProps} />);

        // 500k/1M = 50%, 200k/1M = 20%, 150k/1M = 15%, 150k/1M = 15%
        const percentTags = screen.getAllByTestId("legend-tag");
        expect(percentTags).toHaveLength(4);
        expect(percentTags[0]).toHaveTextContent("50%");
        expect(percentTags[1]).toHaveTextContent("20%");
        expect(percentTags[2]).toHaveTextContent("15%");
        expect(percentTags[3]).toHaveTextContent("15%");
    });

    it("displays formatted dollar values for each type", () => {
        render(<AgreementSpendingSummaryCard {...defaultProps} />);

        const valueContainers = screen.getAllByTestId("value-container");
        expect(valueContainers).toHaveLength(4);

        expect(valueContainers[0]).toHaveTextContent("$500,000.00");
        expect(valueContainers[1]).toHaveTextContent("$200,000.00");
        expect(valueContainers[2]).toHaveTextContent("$150,000.00");
        expect(valueContainers[3]).toHaveTextContent("$150,000.00");
    });

    it("renders the donut chart when totalAmount is greater than 0", () => {
        render(<AgreementSpendingSummaryCard {...defaultProps} />);
        expect(screen.getByTestId("donut-chart")).toBeInTheDocument();
    });

    it("does not render the donut chart when all totals are 0", () => {
        render(
            <AgreementSpendingSummaryCard
                titlePrefix="2025"
                contractTotal={0}
                partnerTotal={0}
                grantTotal={0}
                directObligationTotal={0}
            />
        );
        expect(screen.queryByTestId("donut-chart")).not.toBeInTheDocument();
    });

    it("single type with value shows 100% (no non-zero peers — correct)", () => {
        render(
            <AgreementSpendingSummaryCard
                titlePrefix="2025"
                contractTotal={1_000_000}
                partnerTotal={0}
                grantTotal={0}
                directObligationTotal={0}
            />
        );
        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("$1,000,000.00")).toBeInTheDocument();

        const zeroPercents = screen.getAllByText("0%");
        expect(zeroPercents).toHaveLength(3);
    });

    it("defaults props to 0 when omitted", () => {
        render(<AgreementSpendingSummaryCard titlePrefix="2025" />);

        const zeroValues = screen.getAllByText("$0");
        expect(zeroValues).toHaveLength(4);

        const zeroPercents = screen.getAllByText("0%");
        expect(zeroPercents).toHaveLength(4);

        expect(screen.queryByTestId("donut-chart")).not.toBeInTheDocument();
    });

    it("dominant item shows '99%' instead of '100%' when non-zero peers exist (Figma: no >99%)", () => {
        render(
            <AgreementSpendingSummaryCard
                titlePrefix="2025"
                contractTotal={996}
                partnerTotal={2}
                grantTotal={1}
                directObligationTotal={1}
            />
        );
        expect(screen.getByText("99%")).toBeInTheDocument();
        expect(screen.queryByText(">99%")).not.toBeInTheDocument();
        expect(screen.queryByText("100%")).not.toBeInTheDocument();
    });

    it("sub-1% non-zero items show '<1%' instead of '0%'", () => {
        render(
            <AgreementSpendingSummaryCard
                titlePrefix="2025"
                contractTotal={996}
                partnerTotal={2}
                grantTotal={1}
                directObligationTotal={1}
            />
        );
        const subOne = screen.getAllByText("<1%");
        expect(subOne.length).toBeGreaterThan(0);
    });

    it("3-way equal split: largest remainder makes the legend sum to 100%", () => {
        // 333+333+334+0 = 1000; exact percents are 33.3, 33.3, 33.4, 0.
        // Largest remainder awards the extra point to Grant so the displayed
        // integer labels add up to 100%.
        render(
            <AgreementSpendingSummaryCard
                titlePrefix="2025"
                contractTotal={333}
                partnerTotal={333}
                grantTotal={334}
                directObligationTotal={0}
            />
        );
        const tags = screen.getAllByTestId("legend-tag");
        // Contract: 333/1000 = 33.3 → 33%
        expect(tags[0]).toHaveTextContent("33%");
        // Partner: 333/1000 = 33.3 → 33%
        expect(tags[1]).toHaveTextContent("33%");
        // Grant: 334/1000 = 33.4 → 34% after largest-remainder normalisation
        expect(tags[2]).toHaveTextContent("34%");
        // Direct Obligation: 0 → 0%
        expect(tags[3]).toHaveTextContent("0%");
        // Crucially: dominant-item capping is unrelated to this case.
        expect(screen.queryByText(">99%")).not.toBeInTheDocument();
        expect(screen.queryByText("99%")).not.toBeInTheDocument();
        expect(screen.queryByText("100%")).not.toBeInTheDocument();
    });

    it("passes real legend values to the donut (arc flooring handled inside ResponsiveDonutWithInnerPercent)", () => {
        // Grant = 5 out of 1000 = 0.5% — below the 1% arc floor.
        // The component now passes real values; the donut floors internally.
        render(
            <AgreementSpendingSummaryCard
                titlePrefix="2025"
                contractTotal={995}
                partnerTotal={0}
                grantTotal={5}
                directObligationTotal={0}
            />
        );
        // The mock donut shows the real value (5), not the floored chart value.
        const grantSlice = screen.getByTestId("donut-slice-3");
        const sliceValue = parseFloat(grantSlice.textContent.split(":")[1]);
        expect(sliceValue).toBe(5);
    });

    it("uses the correct aria label on the chart container", () => {
        render(<AgreementSpendingSummaryCard {...defaultProps} />);
        expect(
            screen.getByRole("img", {
                name: "This is a Donut Chart that displays the percent by agreement type in the center."
            })
        ).toBeInTheDocument();
    });
});
