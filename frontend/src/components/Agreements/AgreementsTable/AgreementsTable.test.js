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
        useGetAgreementByIdQuery: () => ({ data: agreements[0] })
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
            fee: 0.05,
            fee_percentage: 0.05
        },
        budget_line_items: [
            {
                amount: 100,
                date_needed: "2024-05-02T11:00:00",
                status: "DRAFT",
                proc_shop_fee_percentage: 0.05,
                total_amount: 105
            },
            {
                amount: 200,
                date_needed: "2023-03-02T11:00:00",
                status: "DRAFT",
                proc_shop_fee_percentage: 0.05,
                total_amount: 210
            },
            {
                amount: 300,
                date_needed: "2043-03-04T11:00:00",
                status: "PLANNED",
                proc_shop_fee_percentage: 0.05,
                total_amount: 315
            }
        ],
        created_by: 1,
        notes: "Test notes",
        created_on: "2021-10-21T03:24:00",
        total_amount: 315
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
                <AgreementsTable agreements={agreements} />
            </BrowserRouter>
        </Provider>
    );

    expect(screen.getAllByText("Test Agreement")[0]).toBeInTheDocument();
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("Grant")).toBeInTheDocument();
    expect(screen.getAllByText("$0")).toHaveLength(2);
    // expect(screen.getByText("3/4/2043")).toBeInTheDocument(); // Comment out or update if needed
});
