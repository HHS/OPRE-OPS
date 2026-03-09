import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AgreementSummaryCardsSection from "./AgreementSummaryCardsSection";

// Mock child components to isolate unit tests
vi.mock("../AgreementCountSummaryCard", () => ({
    default: ({ title, fiscalYear, totals }) => (
        <div data-testid="fy-spending-card">
            <span data-testid="fy-spending-title">{title}</span>
            <span data-testid="fy-spending-fiscal-year">{fiscalYear}</span>
            <span data-testid="fy-spending-count">{totals?.total_agreements_count ?? 0}</span>
        </div>
    )
}));

vi.mock("../AgreementSpendingSummaryCard", () => ({
    default: ({ titlePrefix, contractTotal, partnerTotal, grantTotal, directObligationTotal }) => (
        <div data-testid="type-summary-card">
            <span data-testid="type-title-prefix">{titlePrefix}</span>
            <span data-testid="contract-total">{contractTotal}</span>
            <span data-testid="partner-total">{partnerTotal}</span>
            <span data-testid="grant-total">{grantTotal}</span>
            <span data-testid="do-total">{directObligationTotal}</span>
        </div>
    )
}));

const testTotals = {
    total_contract_amount: 6300,
    total_partner_amount: 2100,
    total_grant_amount: 5250,
    total_direct_obligation_amount: 2100,
    total_agreements_count: 6,
    type_counts: { CONTRACT: 2, GRANT: 1, DIRECT_OBLIGATION: 1, AA: 1, IAA: 1 },
    new_count: 3,
    new_type_counts: { CONTRACT: 1, GRANT: 1, AA: 1 },
    continuing_count: 2,
    continuing_type_counts: { CONTRACT: 1, IAA: 1 }
};

describe("AgreementSummaryCardsSection", () => {
    it("renders both child cards", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={testTotals}
            />
        );
        expect(screen.getByTestId("fy-spending-card")).toBeInTheDocument();
        expect(screen.getByTestId("type-summary-card")).toBeInTheDocument();
    });

    it("passes the correct title based on a numeric fiscal year", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={testTotals}
            />
        );
        expect(screen.getByTestId("fy-spending-title")).toHaveTextContent("2025 Agreements");
        expect(screen.getByTestId("type-title-prefix")).toHaveTextContent("2025");
    });

    it("uses 'Multiple Years' prefix when fiscalYear is 'Multi'", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="Multi"
                totals={testTotals}
            />
        );
        expect(screen.getByTestId("fy-spending-title")).toHaveTextContent("Multiple Years Agreements");
        expect(screen.getByTestId("type-title-prefix")).toHaveTextContent("Multiple Years");
    });

    it("passes the correct agreement count to FY spending card", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={testTotals}
            />
        );
        expect(screen.getByTestId("fy-spending-count")).toHaveTextContent("6");
    });

    it("passes correct contract totals from backend totals", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={testTotals}
            />
        );
        expect(screen.getByTestId("contract-total")).toHaveTextContent("6300");
    });

    it("passes correct partner totals from backend totals", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={testTotals}
            />
        );
        expect(screen.getByTestId("partner-total")).toHaveTextContent("2100");
    });

    it("passes correct grant totals from backend totals", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={testTotals}
            />
        );
        expect(screen.getByTestId("grant-total")).toHaveTextContent("5250");
    });

    it("passes correct direct obligation totals from backend totals", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={testTotals}
            />
        );
        expect(screen.getByTestId("do-total")).toHaveTextContent("2100");
    });

    it("handles null totals gracefully", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                totals={null}
            />
        );
        expect(screen.getByTestId("fy-spending-count")).toHaveTextContent("0");
        expect(screen.getByTestId("contract-total")).toHaveTextContent("0");
        expect(screen.getByTestId("partner-total")).toHaveTextContent("0");
        expect(screen.getByTestId("grant-total")).toHaveTextContent("0");
        expect(screen.getByTestId("do-total")).toHaveTextContent("0");
    });

    it("handles undefined totals gracefully", () => {
        render(<AgreementSummaryCardsSection fiscalYear="2025" />);
        expect(screen.getByTestId("fy-spending-count")).toHaveTextContent("0");
        expect(screen.getByTestId("contract-total")).toHaveTextContent("0");
    });
});
