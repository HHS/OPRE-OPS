import { Provider } from "react-redux";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AgreementsTable from "./AgreementsTable";
import { getTableHeadingsWithFY } from "./AgreementsTable.constants";
import { configureStore } from "@reduxjs/toolkit";
import { vi, describe, it, expect } from "vitest";
import { opsApi } from "../../../api/opsAPI";
import { NO_DATA } from "../../../constants";

// Mock API calls
vi.mock("../../../api/opsAPI", async () => {
    const actual = await vi.importActual("../../../api/opsAPI");
    return {
        ...actual,
        useGetUserByIdQuery: () => ({ data: userData })
    };
});

const agreements = [
    {
        id: 1,
        name: "Test Agreement",
        display_name: "Test Agreement",
        project: { title: "Test Project" },
        agreement_type: "GRANT",
        project_officer_id: 1,
        team_members: [{ id: 1 }],
        procurement_shop: {
            abbr: "GCS",
            fee: 5.0,
            fee_percentage: 5.0
        },
        budget_line_items: [
            {
                amount: 100,
                fees: 5,
                date_needed: "2024-05-02T11:00:00",
                status: "DRAFT",
                proc_shop_fee_percentage: 5.0,
                total: 105,
                fiscal_year: 2025
            },
            {
                amount: 200,
                fees: 10,
                date_needed: "2023-03-02T11:00:00",
                status: "DRAFT",
                proc_shop_fee_percentage: 5.0,
                total: 210,
                fiscal_year: 2025
            },
            {
                amount: 300,
                fees: 15,
                date_needed: "2043-03-04T11:00:00",
                status: "PLANNED",
                proc_shop_fee_percentage: 5.0,
                total: 315,
                fiscal_year: 2025
            }
        ],
        sc_start_date: "2025-01-01",
        sc_end_date: "2025-12-31",
        agreement_subtotal: 300,
        total_agreement_fees: 15,
        agreement_total: 315,
        lifetime_obligated: 0,
        fy_obligated: "0",
        created_by: 1,
        notes: "Test notes",
        created_on: "2021-10-21T03:24:00",
        total_amount: 315,
        _meta: {
            isEditable: true
        }
    }
];

const userData = {
    id: 500,
    full_name: "Test User"
};

const initialState = {
    auth: {
        activeUser: {
            id: 500,
            name: "Test User"
        }
    },
    alert: {
        isActive: false
    }
};

// Use configureStore instead of mockStore
const store = configureStore({
    reducer: {
        [opsApi.reducerPath]: opsApi.reducer,
        auth: (state = initialState.auth) => state,
        alert: (state = initialState.alert) => state
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware),
    preloadedState: initialState
});

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <AgreementsTable
                    agreements={agreements}
                    selectedFiscalYear="2025"
                />
            </BrowserRouter>
        </Provider>
    );

    expect(screen.getAllByText("Test Agreement")[0]).toBeInTheDocument();
    expect(screen.getByText("Grant")).toBeInTheDocument();
    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(screen.getByText("End")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("FY25 Obligated")).toBeInTheDocument();
});

it("does not render contract-only expanded fields for a GRANT agreement row", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <AgreementsTable
                    agreements={agreements}
                    selectedFiscalYear="2025"
                />
            </BrowserRouter>
        </Provider>
    );

    // Expand the grant row so ExpandedData is actually rendered
    fireEvent.click(screen.getByTestId("expand-row"));

    // Contract-only fields must be absent even in the expanded state
    expect(screen.queryByText("Contract #")).not.toBeInTheDocument();
    expect(screen.queryByText("Procurement Shop")).not.toBeInTheDocument();
    expect(screen.queryByText("Award Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Vendor")).not.toBeInTheDocument();
});

describe("getTableHeadingsWithFY", () => {
    it("returns 'FY Obligated' when fiscalYear is 'All'", () => {
        const headings = getTableHeadingsWithFY("All");
        const fyHeading = headings.find((h) => h.heading.includes("Obligated"));
        expect(fyHeading.heading).toBe("FY Obligated");
    });

    it("returns year-specific label for a specific fiscal year", () => {
        const headings = getTableHeadingsWithFY("2025");
        const fyHeading = headings.find((h) => h.heading.includes("Obligated"));
        expect(fyHeading.heading).toBe("FY25 Obligated");
    });
});

// Finding 3: FY Obligated header has no disabled state when "All" is selected.
// AgreementsTable silently no-ops the click but passes no disabled prop to the
// column header, unlike ProjectsTable which sets disabled={true} on SortableHeader.
// This test should FAIL until the disabled prop (and aria/cursor treatment) is wired up.
it("marks the FY Obligated column header as disabled when selectedFiscalYear is 'All'", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <AgreementsTable
                    agreements={agreements}
                    selectedFiscalYear="All"
                    sortConditions="AGREEMENT"
                    sortDescending={false}
                    setSortConditions={vi.fn()}
                />
            </BrowserRouter>
        </Provider>
    );

    // The FY Obligated <th> button should be aria-disabled so screen readers
    // and sighted users know it is not interactive under "All FYs".
    const fyHeader = screen.getByRole("button", { name: /FY Obligated/i });
    expect(fyHeader).toHaveAttribute("aria-disabled", "true");
});

it("shows 'FY Obligated' column header and NO_DATA in the FY column when selectedFiscalYear is 'All'", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <AgreementsTable
                    agreements={agreements}
                    selectedFiscalYear="All"
                />
            </BrowserRouter>
        </Provider>
    );

    expect(screen.getByText("FY Obligated")).toBeInTheDocument();
    expect(screen.queryByText("FY26 Obligated")).not.toBeInTheDocument();
    expect(screen.getByText(NO_DATA)).toBeInTheDocument();
});
