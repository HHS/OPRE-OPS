import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AgreementCountSummaryCard from "./AgreementCountSummaryCard";

const mockTotals = {
    total_contract_amount: 10000,
    total_partner_amount: 5000,
    total_grant_amount: 3000,
    total_direct_obligation_amount: 2000,
    total_agreements_count: 7,
    type_counts: { CONTRACT: 3, GRANT: 1, DIRECT_OBLIGATION: 1, AA: 1, IAA: 1 },
    new_count: 0,
    new_type_counts: {},
    continuing_count: 0,
    continuing_type_counts: {}
};

describe("AgreementCountSummaryCard", () => {
    it("renders the title", () => {
        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                totals={mockTotals}
            />
        );
        expect(screen.getByText("2025 Agreements")).toBeInTheDocument();
    });

    it("renders the fiscal year headings for New and Continuing", () => {
        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                totals={mockTotals}
            />
        );
        expect(screen.getByText("2025 New")).toBeInTheDocument();
        expect(screen.getByText("2025 Continuing")).toBeInTheDocument();
    });

    it("displays the total count of agreements from totals", () => {
        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                totals={mockTotals}
            />
        );
        expect(screen.getByText("7")).toBeInTheDocument();
    });

    it("displays 0 for total and TBD for new/continuing when totals is null", () => {
        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                totals={null}
            />
        );
        expect(screen.getByText("0")).toBeInTheDocument();
        expect(screen.getAllByText("TBD")).toHaveLength(2);
    });

    it("defaults gracefully when totals prop is omitted", () => {
        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
            />
        );
        expect(screen.getByText("0")).toBeInTheDocument();
        expect(screen.getAllByText("TBD")).toHaveLength(2);
    });

    it("dynamically counts agreements by type and renders a tag for each", () => {
        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                totals={mockTotals}
            />
        );

        expect(screen.getByText("3 Contract")).toBeInTheDocument();
        expect(screen.getByText("1 Grant")).toBeInTheDocument();
        expect(screen.getByText("1 Direct Obligation")).toBeInTheDocument();
        // AA and IAA should be combined into a single "Partner" tag
        expect(screen.getByText("2 Partner")).toBeInTheDocument();
    });

    it("handles a single agreement type correctly", () => {
        const singleTypeTotals = {
            ...mockTotals,
            total_agreements_count: 2,
            type_counts: { GRANT: 2 },
            new_count: 0,
            new_type_counts: {},
            continuing_count: 0,
            continuing_type_counts: {}
        };

        render(
            <AgreementCountSummaryCard
                title="FY Agreements"
                fiscalYear="2025"
                totals={singleTypeTotals}
            />
        );

        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("2 Grant")).toBeInTheDocument();
    });

    it("displays TBD for new and continuing columns regardless of data", () => {
        const totalsWithAwardTypes = {
            ...mockTotals,
            total_agreements_count: 5,
            type_counts: { CONTRACT: 2, GRANT: 1, AA: 1, IAA: 1 },
            new_count: 3,
            new_type_counts: { CONTRACT: 1, GRANT: 1, AA: 1 },
            continuing_count: 2,
            continuing_type_counts: { CONTRACT: 1, IAA: 1 }
        };

        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                totals={totalsWithAwardTypes}
            />
        );

        // Total count
        expect(screen.getByText("5")).toBeInTheDocument();
        // New and Continuing show TBD
        expect(screen.getAllByText("TBD")).toHaveLength(2);
    });

    it("displays TBD for new and continuing when totals has zero counts", () => {
        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                totals={mockTotals}
            />
        );

        // Total is 7, new and continuing show TBD
        expect(screen.getByText("7")).toBeInTheDocument();
        expect(screen.getAllByText("TBD")).toHaveLength(2);
    });
});
