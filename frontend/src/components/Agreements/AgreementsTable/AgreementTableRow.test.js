import { render, screen } from "@testing-library/react";
import { AgreementTableRow } from "./AgreementTableRow";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { vi } from "vitest";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { opsApi } from "../../../api/opsAPI";
import { configureStore } from "@reduxjs/toolkit";

const mockFn = TestApplicationContext.helpers().mockFn;
const history = createMemoryHistory();

vi.mock("react", async () => {
    const actual = await vi.importActual("react");
    return {
        ...actual,
        useState: () => [null, mockFn]
    };
});

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockFn
    };
});

// This will reset all mocks after each test
afterEach(() => {
    vi.resetAllMocks();
});

const userData = {
    id: 500,
    full_name: "Test User"
};

vi.mock("../../../api/opsAPI", async () => {
    const actual = await vi.importActual("../../../api/opsAPI");

    return {
        ...actual,
        useGetUserByIdQuery: () => ({ data: userData }),
        useGetAgreementByIdQuery: () => ({ data: agreement, isLoading: false, isSuccess: true })
    };
});

const agreement = {
    id: 1,
    name: "Test Agreement",
    display_name: "Test Agreement",
    project: { title: "Test Project" },
    agreement_type: "GRANT",
    project_officer_id: 1,
    team_members: [{ id: 1 }],
    procurement_shop: { fee: 0.05 },

    budget_line_items: [
        { amount: 100, date_needed: "2024-05-02T11:00:00", status: "DRAFT" },
        { amount: 200, date_needed: "2023-03-02T11:00:00", status: "DRAFT" },
        { amount: 300, date_needed: "2043-03-04T11:00:00", status: "PLANNED", proc_shop_fee_percentage: 0.05 }
    ],
    created_by: 1,
    notes: "Test notes",
    created_on: "2021-10-21T03:24:00"
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

// Create a real Redux store with RTK Query middleware
const store = configureStore({
    reducer: {
        [opsApi.reducerPath]: opsApi.reducer,
        auth: (state = initialState.auth) => state,
        alert: (state = initialState.alert) => state
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware),
    preloadedState: initialState
});

describe("AgreementTableRow", () => {
    test("renders correctly", () => {
        render(
            <Provider store={store}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <table>
                        <tbody>
                            <AgreementTableRow agreement={agreement} />
                        </tbody>
                    </table>
                </Router>
            </Provider>
        );

        expect(screen.getAllByText("Test Agreement")[0]).toBeInTheDocument();
        expect(screen.getByText("Test Project")).toBeInTheDocument();
        expect(screen.getByText("Grant")).toBeInTheDocument();
        expect(screen.getAllByText("$315.00")).toHaveLength(2);
        // expect(screen.getByText("3/4/2043")).toBeInTheDocument();
    });
});
