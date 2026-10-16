import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router-dom";
import { setupStore } from "./store";
import { getTrailFromState } from "./helpers/breadcrumb.helpers";
import { setupListeners } from "@reduxjs/toolkit/query/react";

export function renderWithProviders(
    ui,
    {
        preloadedState = {},
        // Automatically create a store instance if no store was passed in
        store = setupStore(preloadedState),
        // Also render a LocationProbe, for asserting where links navigated.
        withLocationProbe = false,
        ...renderOptions
    } = {}
) {
    setupListeners(store.dispatch);

    function Wrapper({ children }) {
        return (
            <Provider store={store}>
                <MemoryRouter>
                    {children}
                    {withLocationProbe && <LocationProbe />}
                </MemoryRouter>
            </Provider>
        );
    }

    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Renders the router location's pathname and state so tests can assert what a
 * link navigated to (e.g. the breadcrumb trail it carried). Render it next to
 * the component under test, inside the same router.
 */
export function LocationProbe() {
    const location = useLocation();
    return (
        <output
            data-testid="location-probe"
            data-pathname={location.pathname}
        >
            {JSON.stringify(location.state ?? null)}
        </output>
    );
}

/**
 * The breadcrumb trail carried on the probed location (see `LocationProbe`).
 * @returns {import("./helpers/breadcrumb.helpers").BreadcrumbTrail | null}
 */
export function getProbedTrail() {
    return getTrailFromState(JSON.parse(screen.getByTestId("location-probe").textContent));
}
