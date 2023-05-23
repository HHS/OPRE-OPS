import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import createBudgetLineSlice from "../../../pages/budgetLines/createBudgetLineSlice";
import PreviewTable from "./PreviewTable";

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

describe("PreviewTable component", () => {
    const budgetLines = [
        {
            id: 1,
            line_description: "Budget Line 1 Description",
            amount: 100,
            date_needed: "2021-01-01",
            psc_fee_amount: 0,
            amt: 100,
            status: "DRAFT",
            created_on: "2021-01-01",
            can: {
                number: "123456",
            },
            comments: "This is a comment",
        },
        {
            id: 2,
            line_description: "Budget Line 1 Description",
            amount: 200,
            date_needed: "2021-01-01",
            psc_fee_amount: 0,
            amt: 200,
            status: "DRAFT",
            created_on: "2021-01-01",
            can: {
                number: "1234567",
            },
            comments: "This is a comment",
        },
    ];
    it("renders without crashing", () => {
        renderWithRedux(<PreviewTable budgetLines={budgetLines} handleDeleteBudgetLine={() => {}} />);
    });
});
