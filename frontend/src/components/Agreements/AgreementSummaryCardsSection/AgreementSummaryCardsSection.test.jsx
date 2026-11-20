import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AgreementSummaryCardsSection from "./AgreementSummaryCardsSection";

vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent", () => ({
    default: () => <div data-testid="donut-chart" />
}));

vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent", () => ({
    default: () => () => null
}));

const testTotals = {
    total_contract_amount: 6300,
    total_partner_amount: 2200,
    total_grant_amount: 5250,
    total_direct_obligation_amount: 1100,
    total_agreements_count: 6,
    type_counts: { CONTRACT: 2, GRANT: 1, DIRECT_OBLIGATION: 1, AA: 1, IAA: 1 },
    new_count: 3,
    new_type_counts: { CONTRACT: 1, GRANT: 1, AA: 1 },
    continuing_count: 2,
    continuing_type_counts: { CONTRACT: 1, IAA: 1 }
};

const spendingByLabel = () => {
    const labels = screen.getAllByTestId("label-container").map((el) => el.textContent);
    const values = screen.getAllByTestId("value-container").map((el) => el.textContent);
    return Object.fromEntries(labels.map((label, i) => [label, values[i]]));
};

describe("AgreementSummaryCardsSection", () => {
    it("titles the cards with the selected fiscal year", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={testTotals}
            />
        );

        expect(screen.getByRole("heading", { name: "2025 Agreements" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "2025 New" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "2025 Continuing" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "2025 Spending by Agreement Type" })).toBeInTheDocument();
    });

    it("titles the cards 'Multiple Years' when several fiscal years are selected", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="Multi"
                totals={testTotals}
            />
        );

        expect(screen.getByRole("heading", { name: "Multiple Years Agreements" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Multiple Years Spending by Agreement Type" })).toBeInTheDocument();
    });

    it("shows the agreement count and each type's spending from the totals", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={testTotals}
            />
        );

        expect(screen.getByText("6")).toBeInTheDocument();
        expect(spendingByLabel()).toEqual({
            Contract: "$6,300.00",
            Partner: "$2,200.00",
            Grant: "$5,250.00",
            "Direct Obligation": "$1,100.00"
        });
    });

    it("shows zero spending for every type when there are no totals", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={null}
            />
        );

        expect(spendingByLabel()).toEqual({
            Contract: "$0",
            Partner: "$0",
            Grant: "$0",
            "Direct Obligation": "$0"
        });
        expect(screen.queryByTestId("donut-chart")).not.toBeInTheDocument();
    });
});
