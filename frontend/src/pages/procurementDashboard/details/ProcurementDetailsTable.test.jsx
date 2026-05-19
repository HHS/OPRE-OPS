import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ProcurementDetailsTable } from "./ProcurementDetailsTable";

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

describe("ProcurementDetailsTable", () => {
    const defaultProps = {
        agreements: [],
        userNameById: {},
        targetDateByAgreementId: {},
        daysInStepByAgreementId: {}
    };

    const renderComponent = (props = {}) =>
        render(
            <MemoryRouter>
                <ProcurementDetailsTable
                    {...defaultProps}
                    {...props}
                />
            </MemoryRouter>
        );

    it("renders table headings", () => {
        renderComponent();

        expect(screen.getByText("Agreements")).toBeInTheDocument();
        expect(screen.getByText("COR")).toBeInTheDocument();
        expect(screen.getByText("Proc. Shop")).toBeInTheDocument();
        expect(screen.getByText("Total Executing")).toBeInTheDocument();
        expect(screen.getByText("Target Date")).toBeInTheDocument();
        expect(screen.getByText("Days in Step")).toBeInTheDocument();
    });

    it("renders no rows when agreements is empty", () => {
        renderComponent();

        expect(screen.queryAllByTestId("expandable-row")).toHaveLength(0);
    });

    it("renders a row for each agreement", () => {
        const agreements = [makeAgreement({ id: 1 }), makeAgreement({ id: 2 }), makeAgreement({ id: 3 })];

        renderComponent({ agreements });

        expect(screen.getAllByTestId("expandable-row")).toHaveLength(3);
    });
});
