import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import ProjectSpendingAgreementRow from "./ProjectSpendingAgreementRow";

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementSpendingByIdQuery: vi.fn()
}));

import { useGetAgreementSpendingByIdQuery } from "../../../api/opsAPI";

const mockAgreement = {
    id: 1,
    display_name: "Contract #1: African American Child and Family Research Center",
    agreement_type: "CONTRACT",
    sc_start_date: "2043-06-13",
    sc_end_date: "2045-06-13",
    agreement_total: "3298795497.00",
    agreement_subtotal: "3298795497.00",
    total_agreement_fees: "0",
    lifetime_obligated: "1123435677.00",
    description: "Test description",
    contract_number: "XXXX000000001",
    award_type: "NEW_AWARD",
    vendor: "Vendor 1",
    procurement_shop: { abbr: "GCS", fee_percentage: 0 },
    budget_line_items: []
};

const renderRow = ({ fyTotal = null, fiscalYear = 2043 } = {}) =>
    render(
        <BrowserRouter>
            <table>
                <tbody>
                    <ProjectSpendingAgreementRow
                        agreement={mockAgreement}
                        fiscalYear={fiscalYear}
                        fyTotal={fyTotal}
                    />
                </tbody>
            </table>
        </BrowserRouter>
    );

describe("ProjectSpendingAgreementRow", () => {
    beforeEach(() => {
        useGetAgreementSpendingByIdQuery.mockReturnValue({ data: undefined });
    });

    it("renders agreement name linked to agreement detail", () => {
        renderRow();
        const link = screen.getByRole("link", { name: /African American Child/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/agreements/1");
    });

    it("renders agreement type", () => {
        renderRow();
        expect(screen.getByText("Contract")).toBeInTheDocument();
    });

    it("renders start and end dates", () => {
        renderRow();
        expect(screen.getByText("6/13/2043")).toBeInTheDocument();
        expect(screen.getByText("6/13/2045")).toBeInTheDocument();
    });

    it("renders agreement total", () => {
        renderRow();
        expect(screen.getByText("$3,298,795,497.00")).toBeInTheDocument();
    });

    it("shows TBD while the spending query is in flight and no fyTotal prop is given", () => {
        renderRow({ fyTotal: null });
        const cells = screen.getAllByRole("cell");
        expect(cells[4]).toHaveTextContent("TBD");
    });

    it("falls back to the fyTotal prop while the spending query is in flight", () => {
        renderRow({ fyTotal: 151217218 });
        const cells = screen.getAllByRole("cell");
        expect(cells[4]).toHaveTextContent("$151,217,218.00");
    });

    it("prefers FY total from the endpoint over the fyTotal prop", () => {
        useGetAgreementSpendingByIdQuery.mockReturnValue({
            data: { fy_total: { 2043: "5000.00" } }
        });
        renderRow({ fyTotal: 151217218, fiscalYear: 2043 });
        const cells = screen.getAllByRole("cell");
        expect(cells[4]).toHaveTextContent("$5,000.00");
        expect(cells[4]).not.toHaveTextContent("$151,217,218.00");
    });

    it("shows $0 when the endpoint loaded but has no entry for the selected FY", () => {
        // The agreement spending endpoint omits an FY key when none of that FY's budget
        // lines count toward spending. That is zero spending, not unknown (issue #6139).
        useGetAgreementSpendingByIdQuery.mockReturnValue({
            data: { fy_total: { 2044: "5000.00" } }
        });
        renderRow({ fyTotal: 151217218, fiscalYear: 2043 });
        const cells = screen.getAllByRole("cell");
        expect(cells[4]).toHaveTextContent("$0");
        expect(cells[4]).not.toHaveTextContent("$151,217,218.00");
    });

    it("shows $0 when the agreement has no non-draft spending in any fiscal year", () => {
        // The response for a fully-DRAFT agreement: `fy_total` is required by the schema
        // so the key is always present, but the aggregation groups only over budget lines
        // that count toward spending, so the map comes back empty. This is the shape the
        // draft-only agreements surfaced by issue #6139 actually return.
        useGetAgreementSpendingByIdQuery.mockReturnValue({
            data: { fy_total: {} }
        });
        renderRow({ fyTotal: 151217218, fiscalYear: 2043 });
        const cells = screen.getAllByRole("cell");
        expect(cells[4]).toHaveTextContent("$0");
        expect(cells[4]).not.toHaveTextContent("$151,217,218.00");
    });

    it("coerces Decimal-string values from the endpoint to formatted currency", () => {
        useGetAgreementSpendingByIdQuery.mockReturnValue({
            data: { fy_total: { 2043: "1234567.00" } }
        });
        renderRow({ fyTotal: null, fiscalYear: 2043 });
        const cells = screen.getAllByRole("cell");
        expect(cells[4]).toHaveTextContent("$1,234,567.00");
    });

    it("expands to show detail fields on chevron click", async () => {
        const user = userEvent.setup();
        renderRow();

        expect(screen.queryByText("Test description")).not.toBeInTheDocument();

        await user.click(screen.getByTestId("expand-row"));

        expect(screen.getByText("Test description")).toBeInTheDocument();
        expect(screen.getByText("GCS - Fee Rate: 0%")).toBeInTheDocument();
        expect(screen.getByText("XXXX000000001")).toBeInTheDocument();
        expect(screen.getByText("Vendor 1")).toBeInTheDocument();
    });

    it("collapses on second chevron click", async () => {
        const user = userEvent.setup();
        renderRow();

        await user.click(screen.getByTestId("expand-row"));
        expect(screen.getByText("Test description")).toBeInTheDocument();

        await user.click(screen.getByTestId("expand-row"));
        expect(screen.queryByText("Test description")).not.toBeInTheDocument();
    });
});
