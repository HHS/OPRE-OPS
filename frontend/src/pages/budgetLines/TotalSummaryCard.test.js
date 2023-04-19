import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import createBudgetLineSlice from "./createBudgetLineSlice";
import { TotalSummaryCard } from "./TotalSummaryCard";

const renderWithRedux = (
    component,
    {
        initialState = { createBudgetLine: { budgetLines: [] } },
        store = configureStore({ reducer: { createBudgetLine: createBudgetLineSlice }, preloadedState: initialState }),
    } = {}
) => {
    return {
        ...render(<Provider store={store}>{component}</Provider>),
        store,
    };
};

describe("TotalSelect component", () => {
    const budgetLines = [
        {
            id: "1",
            name: "Budget Line 1",
            amount: 100,
            date_needed: "2021-01-01",
            psc_fee_amount: 0,
            amt: 100,
            status: "DRAFT",
        },
        {
            id: "2",
            name: "Budget Line 2",
            amount: 200,
            date_needed: "2021-01-01",
            psc_fee_amount: 0,
            amt: 200,
            status: "DRAFT",
        },
    ];
    it("renders without crashing", () => {
        renderWithRedux(<TotalSummaryCard budgetLines={budgetLines} />);
    });
});
