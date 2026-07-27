import { useCallback } from "react";
import { useSelector, useDispatch, useStore } from "react-redux";
import { setListFilters, setListFiscalYear } from "../sessionUISlice";

/**
 * Session-persistent replacement for a list page's local `useState` filter
 * state. Returns a `useState`-compatible API backed by the shared
 * `sessionUISlice`, so applied filters survive client-side navigation (e.g.
 * returning to a list via breadcrumb) and reset on logout.
 *
 * Both setters accept an object OR a functional updater `(prev) => next`,
 * matching the `useState` contract that the *FilterButton / *FilterTags
 * sub-components rely on. Updaters are resolved against the latest committed
 * store state (via `useStore().getState()`) rather than a possibly-stale
 * render-time closure.
 *
 * @param {string} page - The page key registered in the slice (e.g. "agreements").
 * @returns {{
 *   filters: Object,
 *   setFilters: (updater: Object | ((prev: Object) => Object)) => void,
 *   selectedFiscalYear: string|number|undefined,
 *   setSelectedFiscalYear: (updater: (string|number) | ((prev: string|number) => (string|number))) => void
 * }}
 */
export const useListFilters = (page) => {
    const dispatch = useDispatch();
    const store = useStore();

    const filters = useSelector((state) => state.sessionUI.listFilters[page]?.filters);
    const selectedFiscalYear = useSelector((state) => state.sessionUI.listFilters[page]?.selectedFiscalYear);

    const setFilters = useCallback(
        (updater) => {
            const current = store.getState().sessionUI.listFilters[page]?.filters;
            const next = typeof updater === "function" ? updater(current) : updater;
            dispatch(setListFilters({ page, filters: next }));
        },
        [dispatch, store, page]
    );

    const setSelectedFiscalYear = useCallback(
        (updater) => {
            const current = store.getState().sessionUI.listFilters[page]?.selectedFiscalYear;
            const next = typeof updater === "function" ? updater(current) : updater;
            dispatch(setListFiscalYear({ page, selectedFiscalYear: next }));
        },
        [dispatch, store, page]
    );

    return { filters, setFilters, selectedFiscalYear, setSelectedFiscalYear };
};
