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
        expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("defaults to empty array when agreements prop is omitted", () => {
        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
            />
        );
        expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("dynamically counts agreements by type and renders a tag for each", () => {
        render(
            <AgreementFYSpendingSummaryCard
                title="2025 Agreements"
                fiscalYear="2025"
                agreements={mockAgreements}
            />
        );

        // Dynamically compute expected counts from the mock data
        const expectedCounts = mockAgreements.reduce((acc, { agreement_type }) => {
            if (agreement_type) {
                acc[agreement_type] = (acc[agreement_type] || 0) + 1;
            }
            return acc;
        }, {});

        const displayTextMap = {
            CONTRACT: "Contract",
            GRANT: "Grant",
            DIRECT_OBLIGATION: "Direct Obligation",
            AA: "Partner - AA",
            IAA: "Partner - IAA"
        };

        Object.entries(expectedCounts).forEach(([type, count]) => {
            const label = displayTextMap[type] || type;
            expect(screen.getByText(`${count} ${label}`)).toBeInTheDocument();
        });
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
