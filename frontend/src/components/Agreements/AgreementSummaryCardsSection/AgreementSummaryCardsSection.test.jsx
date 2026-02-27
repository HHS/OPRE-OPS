import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AgreementSummaryCardsSection from "./AgreementSummaryCardsSection";

// Mock child components to isolate unit tests
vi.mock("../AgreementFYSpendingSummaryCard", () => ({
    default: ({ title, fiscalYear, agreements }) => (
        <div data-testid="fy-spending-card">
            <span data-testid="fy-spending-title">{title}</span>
            <span data-testid="fy-spending-fiscal-year">{fiscalYear}</span>
            <span data-testid="fy-spending-count">{agreements.length}</span>
        </div>
    )
}));

vi.mock("../AgreementTypeSummaryCard", () => ({
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

// Build test agreements with budget_line_items including amounts and fees
const makeBLI = (amount, fees, status = "PLANNED", is_obe = false) => ({
    amount,
    fees,
    status,
    is_obe
});

const testAgreements = [
    {
        id: 1,
        agreement_type: "CONTRACT",
        budget_line_items: [makeBLI(1000, 50), makeBLI(2000, 100), makeBLI(500, 0, "DRAFT")]
    },
    {
        id: 2,
        agreement_type: "CONTRACT",
        budget_line_items: [makeBLI(3000, 150)]
    },
    {
        id: 3,
        agreement_type: "GRANT",
        budget_line_items: [makeBLI(4000, 200), makeBLI(1000, 50)]
    },
    {
        id: 4,
        agreement_type: "DIRECT_OBLIGATION",
        budget_line_items: [makeBLI(2000, 100)]
    },
    {
        id: 5,
        agreement_type: "AA",
        budget_line_items: [makeBLI(1500, 75)]
    },
    {
        id: 6,
        agreement_type: "IAA",
        budget_line_items: [makeBLI(500, 25)]
    }
];

// Dynamically compute expected totals using the same logic as the helpers:
// sum of (amount + fees) for non-DRAFT BLIs, grouped by type
const computeExpectedTotal = (agreements, types) => {
    return agreements
        .filter((a) => types.includes(a.agreement_type))
        .reduce((total, agreement) => {
            const bliTotal = (agreement.budget_line_items ?? [])
                .filter(({ status, is_obe }) => is_obe || status !== "DRAFT")
                .reduce((acc, { amount = 0, fees = 0 }) => acc + amount + fees, 0);
            return total + bliTotal;
        }, 0);
};

describe("AgreementSummaryCardsSection", () => {
    it("renders both child cards", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                agreements={testAgreements}
                selectedFiscalYear="2025"
            />
        );
        expect(screen.getByTestId("fy-spending-card")).toBeInTheDocument();
        expect(screen.getByTestId("type-summary-card")).toBeInTheDocument();
    });

    it("passes the correct title based on a numeric fiscal year", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                agreements={testAgreements}
                selectedFiscalYear="2025"
            />
        );
        expect(screen.getByTestId("fy-spending-title")).toHaveTextContent("2025 Agreements");
        expect(screen.getByTestId("type-title-prefix")).toHaveTextContent("2025");
    });

    it("uses 'Multiple Years' prefix when fiscalYear is 'Multi'", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="Multi"
                agreements={testAgreements}
                selectedFiscalYear="All"
            />
        );
        expect(screen.getByTestId("fy-spending-title")).toHaveTextContent("Multiple Years Agreements");
        expect(screen.getByTestId("type-title-prefix")).toHaveTextContent("Multiple Years");
    });

    it("passes the correct agreement count to FY spending card", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                agreements={testAgreements}
                selectedFiscalYear="2025"
            />
        );
        expect(screen.getByTestId("fy-spending-count")).toHaveTextContent(String(testAgreements.length));
    });

    it("computes correct contract totals (excludes DRAFT BLIs, includes amount + fees)", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                agreements={testAgreements}
                selectedFiscalYear="2025"
            />
        );

        const expectedContractTotal = computeExpectedTotal(testAgreements, ["CONTRACT"]);
        // Agreement 1: 1000+50 + 2000+100 (DRAFT excluded) = 3150
        // Agreement 2: 3000+150 = 3150
        // Total: 6300
        expect(expectedContractTotal).toBe(6300);
        expect(screen.getByTestId("contract-total")).toHaveTextContent(String(expectedContractTotal));
    });

    it("computes correct partner totals (AA + IAA)", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                agreements={testAgreements}
                selectedFiscalYear="2025"
            />
        );

        const expectedPartnerTotal = computeExpectedTotal(testAgreements, ["AA", "IAA"]);
        // AA: 1500+75 = 1575
        // IAA: 500+25 = 525
        // Total: 2100
        expect(expectedPartnerTotal).toBe(2100);
        expect(screen.getByTestId("partner-total")).toHaveTextContent(String(expectedPartnerTotal));
    });

    it("computes correct grant totals", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                agreements={testAgreements}
                selectedFiscalYear="2025"
            />
        );

        const expectedGrantTotal = computeExpectedTotal(testAgreements, ["GRANT"]);
        // 4000+200 + 1000+50 = 5250
        expect(expectedGrantTotal).toBe(5250);
        expect(screen.getByTestId("grant-total")).toHaveTextContent(String(expectedGrantTotal));
    });

    it("computes correct direct obligation totals", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                agreements={testAgreements}
                selectedFiscalYear="2025"
            />
        );

        const expectedDOTotal = computeExpectedTotal(testAgreements, ["DIRECT_OBLIGATION"]);
        // 2000+100 = 2100
        expect(expectedDOTotal).toBe(2100);
        expect(screen.getByTestId("do-total")).toHaveTextContent(String(expectedDOTotal));
    });

    it("handles empty agreements array", () => {
        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                agreements={[]}
                selectedFiscalYear="2025"
            />
        );
        expect(screen.getByTestId("fy-spending-count")).toHaveTextContent("0");
        expect(screen.getByTestId("contract-total")).toHaveTextContent("0");
        expect(screen.getByTestId("partner-total")).toHaveTextContent("0");
        expect(screen.getByTestId("grant-total")).toHaveTextContent("0");
        expect(screen.getByTestId("do-total")).toHaveTextContent("0");
    });

    it("excludes DRAFT BLIs but includes OBE BLIs in totals", () => {
        const agreementsWithOBE = [
            {
                id: 1,
                agreement_type: "CONTRACT",
                budget_line_items: [
                    makeBLI(1000, 50, "DRAFT", false), // excluded: DRAFT and not OBE
                    makeBLI(2000, 100, "DRAFT", true), // included: DRAFT but OBE
                    makeBLI(3000, 150, "PLANNED", false) // included: not DRAFT
                ]
            }
        ];

        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                agreements={agreementsWithOBE}
                selectedFiscalYear="2025"
            />
        );

        const expectedTotal = computeExpectedTotal(agreementsWithOBE, ["CONTRACT"]);
        // OBE DRAFT: 2000+100 = 2100, PLANNED: 3000+150 = 3150, Total: 5250
        expect(expectedTotal).toBe(5250);
        expect(screen.getByTestId("contract-total")).toHaveTextContent(String(expectedTotal));
    });

    it("handles agreements with no budget_line_items", () => {
        const agreementsNoBLIs = [
            { id: 1, agreement_type: "CONTRACT", budget_line_items: [] },
            { id: 2, agreement_type: "GRANT" } // no budget_line_items key at all
        ];

        render(
            <AgreementSummaryCardsSection
                fiscalYear="2025"
                agreements={agreementsNoBLIs}
                selectedFiscalYear="2025"
            />
        );

        expect(screen.getByTestId("contract-total")).toHaveTextContent("0");
        expect(screen.getByTestId("grant-total")).toHaveTextContent("0");
    });
});
