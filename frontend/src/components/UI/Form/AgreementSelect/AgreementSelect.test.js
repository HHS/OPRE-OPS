import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import createBudgetLineSlice from "../../../../pages/budgetLines/createBudgetLineSlice";
import { AgreementSelect } from "./AgreementSelect";

const renderWithRedux = (
    component,
    {
        initialState,
        store = configureStore({ reducer: { createBudgetLine: createBudgetLineSlice }, preloadedState: initialState }),
    } = {}
) => {
    return {
        ...render(<Provider store={store}>{component}</Provider>),
        store,
    };
};

describe("AgreementSelect", () => {
    it("renders without crashing", () => {
        renderWithRedux(<AgreementSelect />);
    });

    // Add more tests as needed
});
