import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { BrowserRouter as Router } from "react-router-dom";
import AllBudgetLinesTable from "./AllBudgetLinesTable";
import alertReducer from "../../UI/Alert/alertSlice";
import authReducer from "../../Auth/authSlice";
import { opsApi } from "../../../api/opsAPI";

const mockBudgetLines = [
    {
        id: 1,
        agreement_name: "Agreement 1",
        date_needed: "2023-12-01",
        fiscal_year: 2023,
        can_number: "CAN123",
        amount: 1000,
        status: "Active",
        services_component_id: 1
    },
    {
        id: 2,
        agreement_name: "Agreement 2",
        date_needed: "2023-12-02",
        fiscal_year: 2023,
        can_number: "CAN124",
        amount: 2000,
        status: "Inactive",
        services_component_id: 2
    }
];

const renderWithProviders = (ui, { store } = {}) => {
    const defaultStore = configureStore({
        reducer: {
            alert: alertReducer,
            auth: authReducer,
            [opsApi.reducerPath]: opsApi.reducer
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware),
        preloadedState: {
            auth: {
                activeUser: {
                    roles: ["SYSTEM_OWNER"]
                }
            }
        }
    });

    return render(
        <Provider store={store || defaultStore}>
            <Router>{ui}</Router>
        </Provider>
    );
};

describe("AllBudgetLinesTable", () => {
    test("renders table with budget lines", () => {
        renderWithProviders(<AllBudgetLinesTable budgetLines={mockBudgetLines} />);

        expect(screen.getByText("Agreement 1")).toBeInTheDocument();
        expect(screen.getByText("Agreement 2")).toBeInTheDocument();
    });

    test("renders export button for system admin", () => {
        renderWithProviders(<AllBudgetLinesTable budgetLines={mockBudgetLines} />);

        expect(screen.getByText("Export")).toBeInTheDocument();
    });

    test("handles export button click", () => {
        renderWithProviders(<AllBudgetLinesTable budgetLines={mockBudgetLines} />);

        const exportButton = screen.getByText("Export");
        fireEvent.click(exportButton);
    });

    test("renders pagination when budget lines exceed per page limit", () => {
        const manyBudgetLines = Array.from({ length: 20 }, (_, index) => ({
            ...mockBudgetLines[0],
            id: `bli-${index + 1}`
        }));

        renderWithProviders(<AllBudgetLinesTable budgetLines={manyBudgetLines} />);

        expect(screen.getByText("bli-1")).toBeInTheDocument();
        expect(screen.getByText("bli-2")).toBeInTheDocument();
    });

    test("displays zero results message when no budget lines are provided", () => {
        renderWithProviders(<AllBudgetLinesTable budgetLines={[]} />);

        expect(screen.getByText("There are 0 results based on your filter selections.")).toBeInTheDocument();
    });
});
