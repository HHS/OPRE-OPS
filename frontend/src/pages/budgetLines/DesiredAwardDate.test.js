import { render } from "@testing-library/react";
import { DesiredAwardDate } from "./DesiredAwardDate";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import createBudgetLineSlice from "./createBudgetLineSlice";

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

describe("ProjectSelect component", () => {
    it("renders without crashing", () => {
        renderWithRedux(<DesiredAwardDate />);
    });
});
