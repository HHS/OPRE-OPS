import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AgreementSpendingCards from "./AgreementSpendingCards";

describe("AgreementSpendingCards", () => {
    const mockSpendingData = {
        total_spending: 46000000,
        agreement_types: [
            {
                type: "CONTRACT",
                label: "Contracts",
                total: 20000000,
                percent: "43",
                new: 10000000,
                continuing: 10000000
            },
            { type: "PARTNER", label: "Partner", total: 15000000, percent: "33", new: 8000000, continuing: 7000000 },
            { type: "GRANT", label: "Grants", total: 8000000, percent: "17", new: 5000000, continuing: 3000000 },
            {
                type: "DIRECT_OBLIGATION",
                label: "Direct Oblig.",
                total: 3000000,
                percent: "7",
                new: 2000000,
                continuing: 1000000
            }
        ]
    };

    it("renders with spending data", () => {
        render(
            <AgreementSpendingCards
                fiscalYear={2025}
                spendingData={mockSpendingData}
            />
        );

        expect(screen.getByText("FY 2025 Spending By Agreement Type Across New and Continuing")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-spending-summary-card")).toBeInTheDocument();
    });

    it("displays total spending amount", () => {
        render(
            <AgreementSpendingCards
                fiscalYear={2025}
                spendingData={mockSpendingData}
            />
        );

        expect(screen.getByText(/46,000,000/)).toBeInTheDocument();
    });

    it("renders the footer text", () => {
        render(
            <AgreementSpendingCards
                fiscalYear={2025}
                spendingData={mockSpendingData}
            />
        );

        expect(
            screen.getByText("*Spending equals the sum of Budget Lines in Planned, Executing and Obligated Status")
        ).toBeInTheDocument();
    });

    it("renders the legend", () => {
        render(
            <AgreementSpendingCards
                fiscalYear={2025}
                spendingData={mockSpendingData}
            />
        );

        expect(screen.getByTestId("agreement-spending-legend")).toBeInTheDocument();
    });

    it("handles empty spending data", () => {
        render(
            <AgreementSpendingCards
                fiscalYear={2025}
                spendingData={null}
            />
        );

        expect(screen.getByText("No spending data available for FY 2025")).toBeInTheDocument();
    });

    it("handles zero total spending", () => {
        const zeroData = {
            total_spending: 0,
            agreement_types: []
        };

        render(
            <AgreementSpendingCards
                fiscalYear={2025}
                spendingData={zeroData}
            />
        );

        expect(screen.getByText("No spending data available for FY 2025")).toBeInTheDocument();
    });
});
