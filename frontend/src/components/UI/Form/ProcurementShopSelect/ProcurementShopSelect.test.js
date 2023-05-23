import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import createBudgetLineSlice from "../../../../pages/budgetLines/createBudgetLineSlice";
import ProcurementShopSelect from "./ProcurementShopSelect";

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

describe("ProcureShopSelect component", () => {
    it("renders without crashing", () => {
        renderWithRedux(<ProcurementShopSelect />);
    });
});
