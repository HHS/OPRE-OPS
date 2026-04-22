import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ProcurementDashboard from "./ProcurementDashboardPage";
import { opsApi } from "../../api/opsAPI";

const mockUseGetAllAgreements = vi.fn();
const mockUseGetProcurementShopsQuery = vi.fn();
const mockUseGetProcurementTrackersByAgreementIdsQuery = vi.fn();
const mockExportMultiSheetToXlsx = vi.fn();

vi.mock("../../hooks/useGetAllAgreements", () => ({
    useGetAllAgreements: (params, opts) => mockUseGetAllAgreements(params, opts)
}));

vi.mock("../../api/opsAPI", async () => {
    const actual = await vi.importActual("../../api/opsAPI");
    return {
        ...actual,
        useGetProcurementShopsQuery: () => mockUseGetProcurementShopsQuery(),
        useGetProcurementTrackersByAgreementIdsQuery: (ids, opts) =>
            mockUseGetProcurementTrackersByAgreementIdsQuery(ids, opts)
    };
});

vi.mock("../../App", () => ({
    default: ({ children }) => <div data-testid="app-wrapper">{children}</div>
}));

vi.mock("../../helpers/tableExport.helpers", () => ({
    exportMultiSheetToXlsx: (...args) => mockExportMultiSheetToXlsx(...args)
}));

vi.mock("../../helpers/utils", () => ({
    getCurrentFiscalYear: () => "2025"
}));

vi.mock("./ProcurementSummaryCards", () => ({
    default: () => <div data-testid="summary-cards" />
}));

vi.mock("./ProcurementDashboardTabs", () => ({
    default: () => <div data-testid="dashboard-tabs" />
}));

vi.mock("./ProcShopFilter", () => ({
    default: ({ value, onChange, options }) => (
        <select
            data-testid="proc-shop-filter"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="all">All</option>
            {options.map((o) => (
                <option
                    key={o}
                    value={o}
                >
                    {o}
                </option>
            ))}
        </select>
    )
}));

function renderWithProviders(ui, { route = "/procurement-dashboard" } = {}) {
    const store = configureStore({
        reducer: { [opsApi.reducerPath]: opsApi.reducer },
        middleware: (gDM) => gDM().concat(opsApi.middleware)
    });
    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </Provider>
    );
}

describe("ProcurementDashboardPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetProcurementShopsQuery.mockReturnValue({ data: [{ id: 1, abbr: "GCS" }] });
        mockUseGetAllAgreements.mockReturnValue({
            agreements: [
                {
                    id: 10,
                    name: "Agreement A",
                    agreement_type: "CONTRACT",
                    procurement_shop: { abbr: "GCS" },
                    award_type: "NEW",
                    budget_line_items: [
                        { id: 100, fiscal_year: 2025, status: "IN_EXECUTION", amount: 50000, fees: 2500 },
                        { id: 101, fiscal_year: 2025, status: "Draft", amount: 10000, fees: 500 }
                    ]
                }
            ],
            metadata: {
                procurement_overview: null,
                procurement_step_summary: null
            },
            isLoading: false,
            error: null
        });
        mockUseGetProcurementTrackersByAgreementIdsQuery.mockReturnValue({
            data: [{ agreement_id: 10, active_step_number: 3 }]
        });
    });

    it("renders the page title", () => {
        renderWithProviders(<ProcurementDashboard />);
        expect(screen.getByText("Procurement Dashboard")).toBeInTheDocument();
    });

    it("renders summary cards, tabs, and filter", () => {
        renderWithProviders(<ProcurementDashboard />);
        expect(screen.getByTestId("summary-cards")).toBeInTheDocument();
        expect(screen.getByTestId("dashboard-tabs")).toBeInTheDocument();
        expect(screen.getByTestId("proc-shop-filter")).toBeInTheDocument();
    });

    it("renders export button", () => {
        renderWithProviders(<ProcurementDashboard />);
        expect(screen.getByText("Export")).toBeInTheDocument();
    });

    it("calls exportMultiSheetToXlsx with correct sheets on export click", async () => {
        const user = userEvent.setup();
        renderWithProviders(<ProcurementDashboard />);

        await user.click(screen.getByText("Export"));

        expect(mockExportMultiSheetToXlsx).toHaveBeenCalledTimes(1);
        const callArg = mockExportMultiSheetToXlsx.mock.calls[0][0];
        expect(callArg.filename).toBe("Procurement_Dashboard_FY2025");
        // 1 "All" sheet + 6 step sheets
        expect(callArg.sheets).toHaveLength(7);
        expect(callArg.sheets[0].name).toBe("All");
        expect(callArg.sheets[1].name).toBe("Step 1");
    });

    it("maps executing BLIs into export rows with tracker step", async () => {
        const user = userEvent.setup();
        renderWithProviders(<ProcurementDashboard />);

        await user.click(screen.getByText("Export"));

        const allSheet = mockExportMultiSheetToXlsx.mock.calls[0][0].sheets[0];
        // Only the Executing BLI should be included (Draft is filtered out)
        expect(allSheet.rows).toHaveLength(1);
        expect(allSheet.rows[0]).toEqual([
            10,
            "Agreement A",
            "CONTRACT",
            "GCS",
            "NEW",
            3,
            100,
            2025,
            50000,
            2500,
            52500
        ]);
    });

    it("filters export rows into step-specific sheets", async () => {
        const user = userEvent.setup();
        renderWithProviders(<ProcurementDashboard />);

        await user.click(screen.getByText("Export"));

        const sheets = mockExportMultiSheetToXlsx.mock.calls[0][0].sheets;
        // Step 3 sheet should have the row, others should be empty
        const step3Sheet = sheets.find((s) => s.name === "Step 3");
        expect(step3Sheet.rows).toHaveLength(1);
        const step1Sheet = sheets.find((s) => s.name === "Step 1");
        expect(step1Sheet.rows).toHaveLength(0);
    });

    it("sets currencyColumns to [8, 9, 10] for BLI Amount, Fees, and Total", async () => {
        const user = userEvent.setup();
        renderWithProviders(<ProcurementDashboard />);

        await user.click(screen.getByText("Export"));

        const allSheet = mockExportMultiSheetToXlsx.mock.calls[0][0].sheets[0];
        expect(allSheet.currencyColumns).toEqual([8, 9, 10]);
    });

    it("skips agreements with no executing BLIs in export", async () => {
        mockUseGetAllAgreements.mockReturnValue({
            agreements: [
                {
                    id: 20,
                    name: "No BLIs",
                    agreement_type: "GRANT",
                    procurement_shop: null,
                    award_type: null,
                    budget_line_items: [{ id: 200, fiscal_year: 2025, status: "Draft", amount: 5000, fees: 250 }]
                }
            ],
            metadata: {
                procurement_overview: null,
                procurement_step_summary: null
            },
            isLoading: false,
            error: null
        });
        mockUseGetProcurementTrackersByAgreementIdsQuery.mockReturnValue({ data: [] });

        const user = userEvent.setup();
        renderWithProviders(<ProcurementDashboard />);

        await user.click(screen.getByText("Export"));

        const allSheet = mockExportMultiSheetToXlsx.mock.calls[0][0].sheets[0];
        expect(allSheet.rows).toHaveLength(0);
    });
});
