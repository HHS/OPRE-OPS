import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProcurementDetailsStep from "./ProcurementDetailsStep";

vi.mock("../../../components/UI/TableRowExpandable", () => ({
    default: ({ tableRowData }) => <tr data-testid="expandable-row">{tableRowData}</tr>
}));

vi.mock("../../../components/UI/TableRowExpandable/TableRowExpandable.hooks", () => ({
    useTableRow: () => ({
        isExpanded: false,
        setIsExpanded: vi.fn(),
        setIsRowActive: vi.fn()
    })
}));

const makeAgreement = (overrides = {}) => ({
    id: 10,
    name: "Agreement A",
    display_name: "Agreement A",
    agreement_type: "CONTRACT",
    procurement_shop: { abbr: "GCS", name: "Government Contract Services" },
    project: { title: "Research Project" },
    project_officer_id: 500,
    budget_line_items: [],
    agreement_subtotal: 0,
    total_agreement_fees: 0,
    ...overrides
});

describe("ProcurementDetailsStep", () => {
    const defaultProps = {
        agreements: [],
        agreementsPerStep: 0,
        userNameById: {},
        targetDateByAgreementId: {},
        daysInStepByAgreementId: {}
    };

    const renderComponent = (props = {}) =>
        render(
            <MemoryRouter>
                <ProcurementDetailsStep
                    {...defaultProps}
                    {...props}
                />
            </MemoryRouter>
        );

    it("renders agreement and BLI summary tags", () => {
        renderComponent({ agreementsPerStep: 3 });

        const terms = screen.getAllByRole("term");
        const termTexts = terms.map((t) => t.textContent);
        expect(termTexts).toContain("Agreements");
        expect(termTexts).toContain("Executing Budget Lines");
        expect(termTexts).toContain("Total Executing");
        expect(termTexts).toContain("Total Fees");
    });

    it("computes executing BLI count and totals from agreements", () => {
        const agreements = [
            makeAgreement({
                id: 1,
                budget_line_items: [
                    { id: 100, status: "IN_EXECUTION", amount: 50000, fees: 2500 },
                    { id: 101, status: "DRAFT", amount: 10000, fees: 500 }
                ]
            }),
            makeAgreement({
                id: 2,
                budget_line_items: [{ id: 200, status: "IN_EXECUTION", amount: 30000, fees: 1500 }]
            })
        ];

        renderComponent({ agreements, agreementsPerStep: 2 });

        // 2 executing BLIs and 2 agreementsPerStep both render as "2"
        expect(screen.getAllByText("2")).toHaveLength(2);
        // Total executing: $50,000 + $30,000 = $80,000.00
        expect(screen.getByText("$80,000.00")).toBeInTheDocument();
        // Total fees: $2,500 + $1,500 = $4,000.00
        expect(screen.getByText("$4,000.00")).toBeInTheDocument();
    });

    it("shows zero values when no executing BLIs", () => {
        const agreements = [
            makeAgreement({
                budget_line_items: [{ id: 101, status: "DRAFT", amount: 10000, fees: 500 }]
            })
        ];

        renderComponent({ agreements, agreementsPerStep: 1 });

        // Total Executing = $0, Total Fees = $0, plus $0 in table row
        expect(screen.getAllByText("$0").length).toBeGreaterThanOrEqual(2);
    });

    it("renders a table row for each agreement", () => {
        const agreements = [
            makeAgreement({ id: 1, display_name: "Agreement A" }),
            makeAgreement({ id: 2, display_name: "Agreement B" })
        ];

        renderComponent({ agreements, agreementsPerStep: 2 });

        expect(screen.getAllByTestId("expandable-row")).toHaveLength(2);
    });
});
