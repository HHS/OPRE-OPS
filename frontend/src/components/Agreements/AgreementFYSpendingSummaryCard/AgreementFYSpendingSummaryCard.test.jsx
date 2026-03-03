import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AgreementFYSpendingSummaryCard from "./AgreementFYSpendingSummaryCard";

const mockAgreements = [
    { id: 1, agreement_type: "CONTRACT", budget_line_items: [] },
    { id: 2, agreement_type: "CONTRACT", budget_line_items: [] },
    { id: 3, agreement_type: "GRANT", budget_line_items: [] },
    { id: 4, agreement_type: "DIRECT_OBLIGATION", budget_line_items: [] },
    { id: 5, agreement_type: "AA", budget_line_items: [] },
    { id: 6, agreement_type: "IAA", budget_line_items: [] },
    { id: 7, agreement_type: "CONTRACT", budget_line_items: [] }
];

describe("AgreementFYSpendingSummaryCard", () => {
    it("renders the title", () => {
        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                agreements={[]}
            />
        );
        expect(screen.getByText("2025 Agreements")).toBeInTheDocument();
    });

    it("renders the fiscal year headings for New and Continuing", () => {
        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                agreements={[]}
            />
        );
        expect(screen.getByText("2025 New")).toBeInTheDocument();
        expect(screen.getByText("2025 Continuing")).toBeInTheDocument();
    });

    it("displays the total count of agreements", () => {
        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                agreements={mockAgreements}
            />
        );
        expect(screen.getByText(String(mockAgreements.length))).toBeInTheDocument();
    });

    it("displays 0 when no agreements are provided", () => {
        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                agreements={[]}
            />
        );
        const zeros = screen.getAllByText("0");
        expect(zeros).toHaveLength(3); // total, new, continuing
    });

    it("defaults to empty array when agreements prop is omitted", () => {
        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
            />
        );
        const zeros = screen.getAllByText("0");
        expect(zeros).toHaveLength(3);
    });

    it("dynamically counts agreements by type and renders a tag for each", () => {
        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                agreements={mockAgreements}
            />
        );

        expect(screen.getByText("3 Contract")).toBeInTheDocument();
        expect(screen.getByText("1 Grant")).toBeInTheDocument();
        expect(screen.getByText("1 Direct Obligation")).toBeInTheDocument();
        // AA and IAA should be combined into a single "Partner" tag
        expect(screen.getByText("2 Partner")).toBeInTheDocument();
    });

    it("handles a single agreement type correctly", () => {
        const singleTypeAgreements = [
            { id: 1, agreement_type: "GRANT", budget_line_items: [] },
            { id: 2, agreement_type: "GRANT", budget_line_items: [] }
        ];

        render(
            <AgreementFYSpendingSummaryCard
                title="FY Agreements"
                fiscalYear="2025"
                agreements={singleTypeAgreements}
            />
        );

        expect(screen.getByText(String(singleTypeAgreements.length))).toBeInTheDocument();
        expect(screen.getByText(`${singleTypeAgreements.length} Grant`)).toBeInTheDocument();
    });

    it("displays new and continuing agreement counts", () => {
        const agreementsWithAwardType = [
            { id: 1, agreement_type: "CONTRACT", award_type: "NEW", budget_line_items: [] },
            { id: 2, agreement_type: "CONTRACT", award_type: "CONTINUING", budget_line_items: [] },
            { id: 3, agreement_type: "GRANT", award_type: "NEW", budget_line_items: [] },
            { id: 4, agreement_type: "AA", award_type: "NEW", budget_line_items: [] },
            { id: 5, agreement_type: "IAA", award_type: "CONTINUING", budget_line_items: [] }
        ];

        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                agreements={agreementsWithAwardType}
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
        const agreementsWithAwardType = [
            { id: 1, agreement_type: "CONTRACT", award_type: "NEW", budget_line_items: [] },
            { id: 2, agreement_type: "CONTRACT", award_type: "NEW", budget_line_items: [] },
            { id: 3, agreement_type: "GRANT", award_type: "NEW", budget_line_items: [] },
            { id: 4, agreement_type: "CONTRACT", award_type: "CONTINUING", budget_line_items: [] },
            { id: 5, agreement_type: "AA", award_type: "CONTINUING", budget_line_items: [] }
        ];

        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                agreements={agreementsWithAwardType}
            />
        );

        // Total column tags: 3 Contract, 1 Grant, 1 Partner
        // New column tags: 2 Contract, 1 Grant
        // Continuing column tags: 1 Contract, 1 Partner
        // "Contract" tags exist in all three columns with different counts
        const contractTags = screen.getAllByText(/Contract/);
        expect(contractTags).toHaveLength(3); // total, new, continuing

        // Grant only in total and new
        const grantTags = screen.getAllByText(/Grant/);
        expect(grantTags).toHaveLength(2);

        // Partner only in total and continuing
        const partnerTags = screen.getAllByText(/Partner/);
        expect(partnerTags).toHaveLength(2);
    });

    it("displays 0 for new and continuing when no agreements have award_type", () => {
        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                agreements={mockAgreements}
            />
        );

        // Total is 7, new and continuing are both 0
        expect(screen.getByText("7")).toBeInTheDocument();
        const zeros = screen.getAllByText("0");
        expect(zeros).toHaveLength(2); // new and continuing
    });

    it("skips agreements with no agreement_type", () => {
        const mixedAgreements = [
            { id: 1, agreement_type: "CONTRACT", budget_line_items: [] },
            { id: 2, agreement_type: null, budget_line_items: [] },
            { id: 3, agreement_type: undefined, budget_line_items: [] }
        ];

        render(
            <AgreementFYSpendingSummaryCard
                title="FY Agreements"
                fiscalYear="2025"
                agreements={mixedAgreements}
            />
        );

        // Total count is still all agreements in the array
        expect(screen.getByText(String(mixedAgreements.length))).toBeInTheDocument();
        // Only the CONTRACT tag should be rendered
        expect(screen.getByText("1 Contract")).toBeInTheDocument();
    });
});
