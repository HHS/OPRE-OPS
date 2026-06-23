import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PortfolioBudgetSummary from "./PortfolioBudgetSummary";

vi.mock("../../Agreements/AgreementSpendingCards", () => ({
    default: ({ fiscalYear, spendingData }) => (
        <div data-testid="agreement-spending-cards">
            {fiscalYear} - {JSON.stringify(spendingData)}
        </div>
    )
}));

vi.mock("../../Agreements/AgreementSpendingSummaryCard", () => ({
    default: ({ titlePrefix, contractTotal, partnerTotal, grantTotal, directObligationTotal }) => (
        <div data-testid="agreement-spending-summary-card">
            <span data-testid="title-prefix">{titlePrefix}</span>
            <span data-testid="contract-total">{contractTotal}</span>
            <span data-testid="partner-total">{partnerTotal}</span>
            <span data-testid="grant-total">{grantTotal}</span>
            <span data-testid="direct-obligation-total">{directObligationTotal}</span>
        </div>
    )
}));

vi.mock("../../BudgetLineItems/BLIStatusSummaryCard", () => ({
    default: ({
        titlePrefix,
        totalDraftAmount,
        totalPlannedAmount,
        totalExecutingAmount,
        totalObligatedAmount,
        totalAmount
    }) => (
        <div data-testid="bli-status-summary-card">
            <span data-testid="bli-title-prefix">{titlePrefix}</span>
            <span data-testid="bli-draft">{totalDraftAmount}</span>
            <span data-testid="bli-planned">{totalPlannedAmount}</span>
            <span data-testid="bli-executing">{totalExecutingAmount}</span>
            <span data-testid="bli-obligated">{totalObligatedAmount}</span>
            <span data-testid="bli-total">{totalAmount}</span>
        </div>
    )
}));

vi.mock("../../Reporting/ReportingCountCard", () => ({
    default: ({ fiscalYear, counts }) => (
        <div data-testid="reporting-count-card">
            {fiscalYear} - {JSON.stringify(counts)}
        </div>
    )
}));

vi.mock("../../UI/Cards/BudgetCard/BigBudgetCard", () => ({
    default: ({ title, totalSpending, totalFunding }) => (
        <div data-testid="big-budget-card">
            <span data-testid="budget-title">{title}</span>
            <span data-testid="budget-total-spending">{totalSpending}</span>
            <span data-testid="budget-total-funding">{totalFunding}</span>
        </div>
    )
}));

describe("PortfolioBudgetSummary", () => {
    const defaultProps = {
        fiscalYear: 2026,
        totalFunding: 1_000_000,
        inExecutionFunding: 200_000,
        obligatedFunding: 300_000,
        plannedFunding: 400_000,
        inDraftFunding: 100_000,
        spendingData: {
            agreement_types: [
                { type: "CONTRACT", total: 500_000 },
                { type: "PARTNER", total: 200_000 },
                { type: "GRANT", total: 150_000 },
                { type: "DIRECT_OBLIGATION", total: 150_000 }
            ]
        },
        counts: { total: 10, active: 8 }
    };

    it("renders with valid props", () => {
        render(<PortfolioBudgetSummary {...defaultProps} />);

        expect(screen.getByTestId("big-budget-card")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-spending-cards")).toBeInTheDocument();
        expect(screen.getByTestId("reporting-count-card")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-spending-summary-card")).toBeInTheDocument();
        expect(screen.getByTestId("bli-status-summary-card")).toBeInTheDocument();
    });

    it("calculates totalSpending as planned + obligated + inExecution", () => {
        render(<PortfolioBudgetSummary {...defaultProps} />);

        // 400_000 + 300_000 + 200_000 = 900_000
        expect(screen.getByTestId("budget-total-spending")).toHaveTextContent("900000");
    });

    it("calculates totalBLIAmount as draft + planned + inExecution + obligated", () => {
        render(<PortfolioBudgetSummary {...defaultProps} />);

        // 100_000 + 400_000 + 200_000 + 300_000 = 1_000_000
        expect(screen.getByTestId("bli-total")).toHaveTextContent("1000000");
    });

    it("extracts agreement type totals from spendingData", () => {
        render(<PortfolioBudgetSummary {...defaultProps} />);

        expect(screen.getByTestId("contract-total")).toHaveTextContent("500000");
        expect(screen.getByTestId("partner-total")).toHaveTextContent("200000");
        expect(screen.getByTestId("grant-total")).toHaveTextContent("150000");
        expect(screen.getByTestId("direct-obligation-total")).toHaveTextContent("150000");
    });

    it("defaults agreement type totals to 0 when spendingData is undefined", () => {
        render(
            <PortfolioBudgetSummary
                {...defaultProps}
                spendingData={undefined}
            />
        );

        expect(screen.getByTestId("contract-total")).toHaveTextContent("0");
        expect(screen.getByTestId("partner-total")).toHaveTextContent("0");
        expect(screen.getByTestId("grant-total")).toHaveTextContent("0");
        expect(screen.getByTestId("direct-obligation-total")).toHaveTextContent("0");
    });

    it("defaults agreement type totals to 0 when spendingData is null", () => {
        render(
            <PortfolioBudgetSummary
                {...defaultProps}
                spendingData={null}
            />
        );

        expect(screen.getByTestId("contract-total")).toHaveTextContent("0");
        expect(screen.getByTestId("partner-total")).toHaveTextContent("0");
        expect(screen.getByTestId("grant-total")).toHaveTextContent("0");
        expect(screen.getByTestId("direct-obligation-total")).toHaveTextContent("0");
    });

    it("defaults agreement type totals to 0 when a type is missing from the array", () => {
        render(
            <PortfolioBudgetSummary
                {...defaultProps}
                spendingData={{ agreement_types: [{ type: "CONTRACT", total: 100 }] }}
            />
        );

        expect(screen.getByTestId("contract-total")).toHaveTextContent("100");
        expect(screen.getByTestId("partner-total")).toHaveTextContent("0");
        expect(screen.getByTestId("grant-total")).toHaveTextContent("0");
        expect(screen.getByTestId("direct-obligation-total")).toHaveTextContent("0");
    });

    it("passes fiscalYear-based title to BigBudgetCard", () => {
        render(<PortfolioBudgetSummary {...defaultProps} />);

        expect(screen.getByTestId("budget-title")).toHaveTextContent("FY 2026 Available Portfolio Budget *");
    });

    it("passes totalFunding to BigBudgetCard", () => {
        render(<PortfolioBudgetSummary {...defaultProps} />);

        expect(screen.getByTestId("budget-total-funding")).toHaveTextContent("1000000");
    });

    it("passes FY-prefixed titlePrefix to child summary cards", () => {
        render(<PortfolioBudgetSummary {...defaultProps} />);

        expect(screen.getByTestId("title-prefix")).toHaveTextContent("FY 2026");
        expect(screen.getByTestId("bli-title-prefix")).toHaveTextContent("FY 2026");
    });

    it("passes individual funding amounts to BLIStatusSummaryCard", () => {
        render(<PortfolioBudgetSummary {...defaultProps} />);

        expect(screen.getByTestId("bli-draft")).toHaveTextContent("100000");
        expect(screen.getByTestId("bli-planned")).toHaveTextContent("400000");
        expect(screen.getByTestId("bli-executing")).toHaveTextContent("200000");
        expect(screen.getByTestId("bli-obligated")).toHaveTextContent("300000");
    });

    it("handles NaN-coercible funding values by producing NaN totals", () => {
        render(
            <PortfolioBudgetSummary
                {...defaultProps}
                plannedFunding={undefined}
                obligatedFunding={undefined}
                inExecutionFunding={undefined}
                inDraftFunding={undefined}
            />
        );

        expect(screen.getByTestId("budget-total-spending")).toHaveTextContent("NaN");
        expect(screen.getByTestId("bli-total")).toHaveTextContent("NaN");
    });
});
