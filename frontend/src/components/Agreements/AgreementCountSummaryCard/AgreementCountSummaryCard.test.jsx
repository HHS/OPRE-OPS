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

    it("displays 0 when totals is null", () => {
        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                totals={null}
            />
        );
        const zeros = screen.getAllByText("0");
        expect(zeros).toHaveLength(3); // total, new, continuing
    });

    it("defaults gracefully when totals prop is omitted", () => {
        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
            />
        );
        const zeros = screen.getAllByText("0");
        expect(zeros).toHaveLength(3);
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

    it("displays new and continuing agreement counts from totals", () => {
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
        // New count
        expect(screen.getByText("3")).toBeInTheDocument();
        // Continuing count
        expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("displays type breakdown tags under new and continuing columns", () => {
        const totalsWithAwardTypes = {
            ...mockTotals,
            total_agreements_count: 5,
            type_counts: { CONTRACT: 3, GRANT: 1, AA: 1 },
            new_count: 3,
            new_type_counts: { CONTRACT: 2, GRANT: 1 },
            continuing_count: 2,
            continuing_type_counts: { CONTRACT: 1, AA: 1 }
        };

        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                totals={totalsWithAwardTypes}
            />
        );

        // Total column tags: 3 Contract, 1 Grant, 1 Partner
        // New column tags: 2 Contract, 1 Grant
        // Continuing column tags: 1 Contract, 1 Partner
        const contractTags = screen.getAllByText(/Contract/);
        expect(contractTags).toHaveLength(3); // total, new, continuing

        // Grant only in total and new
        const grantTags = screen.getAllByText(/Grant/);
        expect(grantTags).toHaveLength(2);

        // Partner only in total and continuing
        const partnerTags = screen.getAllByText(/Partner/);
        expect(partnerTags).toHaveLength(2);
    });

    it("displays 0 for new and continuing when totals has zero counts", () => {
        render(
            <AgreementCountSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                totals={mockTotals}
            />
        );

        // Total is 7, new and continuing are both 0
        expect(screen.getByText("7")).toBeInTheDocument();
        const zeros = screen.getAllByText("0");
        expect(zeros).toHaveLength(2); // new and continuing
    });
});
