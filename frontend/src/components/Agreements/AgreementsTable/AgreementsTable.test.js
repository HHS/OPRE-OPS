import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AgreementsTable from "./AgreementsTable";
import { configureStore } from "@reduxjs/toolkit";
import { vi } from "vitest";
import { opsApi } from "../../../api/opsAPI";

// Mock API calls
vi.mock("../../../api/opsAPI", async () => {
    const actual = await vi.importActual("../../../api/opsAPI");
    return {
        ...actual,
        useGetUserByIdQuery: () => ({ data: userData }),
        useGetAgreementByIdQuery: () => ({ data: agreements[0], isLoading: false, isSuccess: true })
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
        start_date: "2025-01-01T00:00:00",
        end_date: "2025-12-31T00:00:00",
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
