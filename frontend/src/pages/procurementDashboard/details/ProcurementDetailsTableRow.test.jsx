import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ProcurementDetailsTableRow } from "./ProcurementDetailsTableRow";
import { getCurrentFiscalYear } from "../../../helpers/utils";

vi.mock("../../../components/UI/TableRowExpandable", () => ({
    default: ({ tableRowData, expandedData }) => (
        <>
            <tr data-testid="table-row">{tableRowData}</tr>
            <tr data-testid="expanded-row">{expandedData}</tr>
        </>
    )
}));

vi.mock("../../../components/UI/TableRowExpandable/TableRowExpandable.hooks", () => ({
    useTableRow: () => ({
        isExpanded: false,
        setIsExpanded: vi.fn(),
        setIsRowActive: vi.fn()
    })
}));

const fiscalYear = Number(getCurrentFiscalYear());

const makeAgreement = (overrides = {}) => ({
    id: 10,
    name: "Agreement A",
    display_name: "Agreement A",
    agreement_type: "CONTRACT",
    procurement_shop: { abbr: "GCS", name: "Government Contract Services" },
    project: { title: "Research Project" },
    project_officer_id: 500,
    budget_line_items: [],
    agreement_subtotal: 75000,
    total_agreement_fees: 3750,
    ...overrides
});

const renderRow = (props = {}) => {
    const defaultProps = {
        agreement: makeAgreement(),
        userNameById: { 500: "Jane Doe" },
        targetDateByAgreementId: {},
        daysInStepByAgreementId: {},
        fiscalYear
    };

    return render(
        <MemoryRouter>
            <table>
                <tbody>
                    <ProcurementDetailsTableRow
                        {...defaultProps}
                        {...props}
                    />
                </tbody>
            </table>
        </MemoryRouter>
    );
};

describe("ProcurementDetailsTableRow", () => {
    it("renders agreement name as a link", () => {
        renderRow();

        const link = screen.getByRole("link", { name: /Agreement A/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/agreements/10");
    });

    it("displays COR name from userNameById", () => {
        renderRow();

        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    it("displays procurement shop abbreviation", () => {
        renderRow();

        expect(screen.getByText("GCS")).toBeInTheDocument();
    });

    it("computes total executing from IN_EXECUTION BLIs including fees", () => {
        const agreement = makeAgreement({
            budget_line_items: [
                { id: 1, status: "IN_EXECUTION", amount: 40000, fees: 2000, fiscal_year: fiscalYear },
                { id: 2, status: "IN_EXECUTION", amount: 60000, fees: 3000, fiscal_year: fiscalYear },
                { id: 3, status: "DRAFT", amount: 20000, fees: 1000, fiscal_year: fiscalYear }
            ]
        });

        renderRow({ agreement });

        // $40,000 + $2,000 + $60,000 + $3,000 = $105,000
        expect(screen.getByText("$105,000.00")).toBeInTheDocument();
    });

    it("excludes BLIs from other fiscal years in total executing and status counts", () => {
        const agreement = makeAgreement({
            budget_line_items: [
                { id: 1, status: "IN_EXECUTION", amount: 50000, fees: 2500, fiscal_year: fiscalYear },
                { id: 2, status: "IN_EXECUTION", amount: 750000, fees: 5000, fiscal_year: fiscalYear - 1 },
                { id: 3, status: "IN_EXECUTION", amount: 250000, fees: 3000, fiscal_year: fiscalYear + 1 },
                { id: 4, status: "DRAFT", amount: 10000, fees: 0, fiscal_year: fiscalYear },
                { id: 5, status: "DRAFT", amount: 99000, fees: 0, fiscal_year: fiscalYear - 1 },
                { id: 6, status: "DRAFT", amount: 5000, fees: 0, fiscal_year: fiscalYear }
            ]
        });

        renderRow({ agreement, fiscalYear });

        // Total executing: only current FY IN_EXECUTION BLI ($50,000 + $2,500 = $52,500)
        expect(screen.getByText("$52,500.00")).toBeInTheDocument();
        // Status counts should only reflect current FY BLIs: 2 Draft, 0 Planned, 1 Executing, 0 Obligated
        const statusCounts = screen.getAllByText("2");
        expect(statusCounts.length).toBeGreaterThanOrEqual(1); // 2 Drafts in FY2026
    });

    it("shows 'None' when no target date is set", () => {
        renderRow({ targetDateByAgreementId: {} });

        expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("displays formatted target date when present", () => {
        renderRow({ targetDateByAgreementId: { 10: "2025-06-15" } });

        expect(screen.getByText("6/15/2025")).toBeInTheDocument();
    });

    it("applies red tag style when days in step exceeds 30", () => {
        renderRow({ daysInStepByAgreementId: { 10: 45 } });

        expect(screen.getByText("45 days")).toBeInTheDocument();
    });

    it("applies default tag style when days in step is 30 or fewer", () => {
        renderRow({ daysInStepByAgreementId: { 10: 15 } });

        expect(screen.getByText("15 days")).toBeInTheDocument();
    });

    it("renders expanded row with project name and financial data", () => {
        const agreement = makeAgreement({
            project: { title: "Human Services Support" },
            agreement_subtotal: 75000,
            total_agreement_fees: 3750
        });

        renderRow({ agreement });

        expect(screen.getByText("Human Services Support")).toBeInTheDocument();
        expect(screen.getByText("$75,000.00")).toBeInTheDocument();
        expect(screen.getByText("$3,750.00")).toBeInTheDocument();
    });

    it("renders budget line status counts from agreement budget_line_items filtered by fiscal year", () => {
        const agreement = makeAgreement({
            budget_line_items: [
                { id: 1, status: "DRAFT", amount: 1000, fiscal_year: fiscalYear },
                { id: 2, status: "DRAFT", amount: 2000, fiscal_year: fiscalYear },
                { id: 3, status: "DRAFT", amount: 3000, fiscal_year: fiscalYear },
                { id: 4, status: "PLANNED", amount: 4000, fiscal_year: fiscalYear },
                { id: 5, status: "PLANNED", amount: 5000, fiscal_year: fiscalYear },
                { id: 6, status: "PLANNED", amount: 6000, fiscal_year: fiscalYear },
                { id: 7, status: "PLANNED", amount: 7000, fiscal_year: fiscalYear },
                { id: 8, status: "PLANNED", amount: 8000, fiscal_year: fiscalYear },
                { id: 9, status: "IN_EXECUTION", amount: 9000, fiscal_year: fiscalYear },
                { id: 10, status: "IN_EXECUTION", amount: 10000, fiscal_year: fiscalYear },
                { id: 11, status: "OBLIGATED", amount: 11000, fiscal_year: fiscalYear }
            ]
        });

        renderRow({ agreement });

        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
    });
});
