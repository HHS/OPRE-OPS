import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ProcurementDetails from "./ProcurementDetails";
import { opsApi } from "../../../api/opsAPI";

const mockUseGetUsersQuery = vi.fn();

vi.mock("../../../api/opsAPI", async () => {
    const actual = await vi.importActual("../../../api/opsAPI");
    return {
        ...actual,
        useGetUsersQuery: () => mockUseGetUsersQuery()
    };
});

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

function renderComponent(props = {}) {
    const store = configureStore({
        reducer: { [opsApi.reducerPath]: opsApi.reducer },
        middleware: (gDM) => gDM().concat(opsApi.middleware)
    });

    const defaultProps = {
        fiscalYear: 2025,
        agreements: [],
        procurementTrackers: [],
        procurementStepSummary: null,
        procurementDaysInStep: null
    };

    return render(
        <Provider store={store}>
            <MemoryRouter>
                <ProcurementDetails
                    {...defaultProps}
                    {...props}
                />
            </MemoryRouter>
        </Provider>
    );
}

describe("ProcurementDetails", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetUsersQuery.mockReturnValue({ data: [{ id: 500, display_name: "Jane Doe" }] });
    });

    it("renders heading and fiscal year description", () => {
        renderComponent({ fiscalYear: 2025 });

        expect(screen.getByText("Procurement Details")).toBeInTheDocument();
        expect(screen.getByText(/FY 2025/)).toBeInTheDocument();
    });

    it("renders all six procurement step accordions", () => {
        renderComponent();

        const stepLabels = [
            "Acquisition Planning",
            "Pre-Solicitation",
            "Solicitation",
            "Evaluation",
            "Pre-Award",
            "Award"
        ];

        for (const label of stepLabels) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
    });

    it("groups agreements into steps based on tracker active_step_number", () => {
        const agreements = [
            makeAgreement({ id: 1, display_name: "Agreement Step 1" }),
            makeAgreement({ id: 2, display_name: "Agreement Step 3" })
        ];

        const procurementTrackers = [
            { agreement_id: 1, active_step_number: 1, steps: [] },
            { agreement_id: 2, active_step_number: 3, steps: [] }
        ];

        renderComponent({ agreements, procurementTrackers });

        const rows = screen.getAllByTestId("expandable-row");
        expect(rows).toHaveLength(2);
    });

    it("resolves user display names from the users query", () => {
        mockUseGetUsersQuery.mockReturnValue({
            data: [{ id: 500, display_name: "Jane Doe" }]
        });

        const agreements = [makeAgreement({ id: 1, project_officer_id: 500 })];
        const procurementTrackers = [{ agreement_id: 1, active_step_number: 1, steps: [] }];

        renderComponent({ agreements, procurementTrackers });

        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    it("falls back to full_name when display_name is absent", () => {
        mockUseGetUsersQuery.mockReturnValue({
            data: [{ id: 500, full_name: "Jane M. Doe" }]
        });

        const agreements = [makeAgreement({ id: 1, project_officer_id: 500 })];
        const procurementTrackers = [{ agreement_id: 1, active_step_number: 1, steps: [] }];

        renderComponent({ agreements, procurementTrackers });

        expect(screen.getByText("Jane M. Doe")).toBeInTheDocument();
    });
});
