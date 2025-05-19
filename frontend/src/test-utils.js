import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "./store";
import { setupListeners } from "@reduxjs/toolkit/query/react";

export function renderWithProviders(
    ui,
    {
        preloadedState = {},
        // Automatically create a store instance if no store was passed in
        store = setupStore(preloadedState),
        ...renderOptions
    } = {}
) {
    setupListeners(store.dispatch);

    function Wrapper({ children }) {
        return (
            <Provider store={store}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );
    }

    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
