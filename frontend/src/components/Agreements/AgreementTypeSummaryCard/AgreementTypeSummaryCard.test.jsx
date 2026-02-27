import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AgreementTypeSummaryCard from "./AgreementTypeSummaryCard";

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

describe("AgreementTypeSummaryCard", () => {
    const defaultProps = {
        titlePrefix: "2025",
        contractTotal: 500_000,
        partnerTotal: 200_000,
        grantTotal: 150_000,
        directObligationTotal: 150_000
    };

    it("renders the spending by agreement type title", () => {
        render(<AgreementTypeSummaryCard {...defaultProps} />);
        expect(screen.getByText("2025 Spending by Agreement Type")).toBeInTheDocument();
    });

    it("renders all four legend labels", () => {
        render(<AgreementTypeSummaryCard {...defaultProps} />);
        expect(screen.getByText("Contract")).toBeInTheDocument();
        expect(screen.getByText("Partner")).toBeInTheDocument();
        expect(screen.getByText("Grant")).toBeInTheDocument();
        expect(screen.getByText("Direct Obligation")).toBeInTheDocument();
    });

    it("computes and displays correct percentages dynamically", () => {
        render(<AgreementTypeSummaryCard {...defaultProps} />);

        const { contractTotal, partnerTotal, grantTotal, directObligationTotal } = defaultProps;
        const totalAmount = contractTotal + partnerTotal + grantTotal + directObligationTotal;

        const expectedData = [
            { label: "Contract", value: contractTotal },
            { label: "Partner", value: partnerTotal },
            { label: "Grant", value: grantTotal },
            { label: "Direct Obligation", value: directObligationTotal }
        ];

        // Get all legend tags (they render as percent% text)
        const percentTags = screen.getAllByTestId("legend-tag");
        expect(percentTags).toHaveLength(4);

        expectedData.forEach((item, index) => {
            const expectedPercent = Math.round((item.value / totalAmount) * 100);
            expect(percentTags[index]).toHaveTextContent(`${expectedPercent}%`);
        });
    });

    it("displays formatted dollar values for each type", () => {
        render(<AgreementTypeSummaryCard {...defaultProps} />);

        const valueContainers = screen.getAllByTestId("value-container");
        expect(valueContainers).toHaveLength(4);

        // CurrencyFormat renders with commas and $ prefix
        expect(valueContainers[0]).toHaveTextContent("$500,000.00"); // Contract
        expect(valueContainers[1]).toHaveTextContent("$200,000.00"); // Partner
        expect(valueContainers[2]).toHaveTextContent("$150,000.00"); // Grant
        expect(valueContainers[3]).toHaveTextContent("$150,000.00"); // Direct Obligation
    });

    it("renders the donut chart when totalAmount is greater than 0", () => {
        render(<AgreementTypeSummaryCard {...defaultProps} />);
        expect(screen.getByTestId("donut-chart")).toBeInTheDocument();
    });

    it("does not render the donut chart when all totals are 0", () => {
        render(
            <AgreementTypeSummaryCard
                titlePrefix="2025"
                contractTotal={0}
                partnerTotal={0}
                grantTotal={0}
                directObligationTotal={0}
            />
        );
        expect(screen.queryByTestId("donut-chart")).not.toBeInTheDocument();
    });

    it("handles when only one type has a value", () => {
        render(
            <AgreementTypeSummaryCard
                titlePrefix="2025"
                contractTotal={1_000_000}
                partnerTotal={0}
                grantTotal={0}
                directObligationTotal={0}
            />
        );

        // Contract should be 100%
        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("$1,000,000.00")).toBeInTheDocument();

        // Zero-value types should show 0%
        const zeroPercents = screen.getAllByText("0%");
        expect(zeroPercents).toHaveLength(3);
    });

    it("defaults props to 0 when omitted", () => {
        render(<AgreementTypeSummaryCard titlePrefix="2025" />);

        // All values should be $0 (no decimal for zero)
        const zeroValues = screen.getAllByText("$0");
        expect(zeroValues).toHaveLength(4);

        // All percentages should be 0%
        const zeroPercents = screen.getAllByText("0%");
        expect(zeroPercents).toHaveLength(4);

        // Donut chart should not render
        expect(screen.queryByTestId("donut-chart")).not.toBeInTheDocument();
    });

    it("computes correct percentages for uneven distributions", () => {
        const unevenProps = {
            titlePrefix: "2025",
            contractTotal: 333,
            partnerTotal: 333,
            grantTotal: 333,
            directObligationTotal: 1
        };

        render(<AgreementTypeSummaryCard {...unevenProps} />);

        const total = unevenProps.contractTotal + unevenProps.partnerTotal + unevenProps.grantTotal + unevenProps.directObligationTotal;

        // Each 333 / 1000 = 33.3 → rounds to 33%
        const contractPercent = Math.round((unevenProps.contractTotal / total) * 100);
        expect(contractPercent).toBe(33);

        // 1 / 1000 = 0.1 → rounds to 0%
        const doPercent = Math.round((unevenProps.directObligationTotal / total) * 100);
        expect(doPercent).toBe(0);
    });

    it("uses the correct aria label on the chart container", () => {
        render(<AgreementTypeSummaryCard {...defaultProps} />);
        expect(
            screen.getByRole("img", {
                name: "This is a Donut Chart that displays the percent by agreement type in the center."
            })
        ).toBeInTheDocument();
    });
});
