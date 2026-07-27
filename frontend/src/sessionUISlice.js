import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./components/Auth/authSlice";
import { getCurrentFiscalYear } from "./helpers/utils";
import { DEFAULT_PORTFOLIO_BUDGET_RANGE } from "./constants";

/**
 * Session-scoped UI state that survives client-side navigation and tab switches
 * but is intentionally lost on browser refresh / new tab (in-memory Redux) and
 * cleared on logout.
 *
 * Deliverable A (breadcrumbs) uses `navContext.trail`.
 * Deliverable B (filter persistence) uses `listFilters` — per-page filter +
 * fiscal-year selections that persist across client-side navigation so a user
 * returning to a list via breadcrumb keeps their filters applied.
 *
 * Both share a single logout-reset hook (see `extraReducers`).
 *
 * @typedef {Object} BreadcrumbAncestor
 * @property {string} label - The crumb text.
 * @property {string} to - The path the crumb links to.
 *
 * @typedef {Object} BreadcrumbTrail
 * @property {string} targetPath - Destination base pathname the trail applies to (e.g. "/agreements/123").
 * @property {BreadcrumbAncestor[]} ancestors - Crumbs shown before the leaf, in order.
 */

/**
 * Per-page default filter state. Each shape is copied VERBATIM from the list
 * page's original `useState` initializer so behavior is unchanged on first
 * load. `selectedFiscalYear` is persisted alongside `filters` because the
 * resolved query blends both — persisting only `filters` would silently reset
 * the fiscal year on return.
 *
 * The BudgetLines fiscal-year filter is derived (approach A/B, query-param
 * driven) and resolves to `null` today, so a `null` default is safe here; the
 * derived helpers stay in the page, out of the slice.
 */
const listFilterDefaults = {
    agreements: {
        filters: {
            portfolio: [],
            fiscalYear: [],
            projectTitle: [],
            agreementType: [],
            agreementName: [],
            contractNumber: [],
            awardType: []
        },
        selectedFiscalYear: getCurrentFiscalYear()
    },
    cans: {
        filters: {
            activePeriod: [],
            transfer: [],
            portfolio: [],
            can: [],
            budget: []
        },
        selectedFiscalYear: getCurrentFiscalYear()
    },
    budgetLines: {
        filters: {
            fiscalYears: null,
            portfolios: [],
            bliStatus: [],
            budgetRange: null,
            agreementTypes: [],
            agreementTitles: [],
            canActivePeriods: []
        }
        // No page-level selectedFiscalYear: the FY dropdown is derived from
        // filters.fiscalYears via the A/B helpers.
    },
    portfolios: {
        filters: {
            portfolios: [],
            budgetRange: DEFAULT_PORTFOLIO_BUDGET_RANGE,
            availablePct: []
        },
        selectedFiscalYear: getCurrentFiscalYear()
    },
    projects: {
        filters: {
            fiscalYear: [],
            portfolio: [],
            projectSearch: [],
            agreementSearch: [],
            projectType: []
        },
        selectedFiscalYear: getCurrentFiscalYear()
    },
    procurementDashboard: {
        filters: {
            procShop: [],
            division: []
        }
        // No fiscal-year selection: the dashboard is pinned to the current FY.
    }
};

/**
 * Build the initial listFilters state from the per-page defaults. Deep-cloned
 * so the exported defaults are never mutated by Immer.
 * @returns {Record<string, {filters: Object, selectedFiscalYear?: string|number}>}
 */
const buildListFiltersInitialState = () =>
    Object.fromEntries(
        Object.entries(listFilterDefaults).map(([page, def]) => [
            page,
            {
                filters: structuredClone(def.filters),
                ...("selectedFiscalYear" in def ? { selectedFiscalYear: def.selectedFiscalYear } : {})
            }
        ])
    );

const initialState = {
    navContext: {
        /** @type {BreadcrumbTrail | null} */
        trail: null
    },
    listFilters: buildListFiltersInitialState()
};

const sessionUISlice = createSlice({
    name: "sessionUI",
    initialState,
    reducers: {
        /**
         * Record the breadcrumb trail for a destination, set synchronously at
         * click time (before navigation) so the destination renders with the
         * correct crumbs and no first-paint flicker.
         * @param {typeof initialState} state
         * @param {{ payload: BreadcrumbTrail }} action
         */
        setTrail: (state, action) => {
            state.navContext.trail = action.payload;
        },
        /**
         * Clear any stored breadcrumb trail.
         * @param {typeof initialState} state
         */
        clearTrail: (state) => {
            state.navContext.trail = null;
        },
        /**
         * Replace the applied filters for a list page.
         * @param {typeof initialState} state
         * @param {{ payload: { page: string, filters: Object } }} action
         */
        setListFilters: (state, action) => {
            const { page, filters } = action.payload;
            if (!state.listFilters[page]) return;
            state.listFilters[page].filters = filters;
        },
        /**
         * Set the selected fiscal year for a list page.
         * @param {typeof initialState} state
         * @param {{ payload: { page: string, selectedFiscalYear: string|number } }} action
         */
        setListFiscalYear: (state, action) => {
            const { page, selectedFiscalYear } = action.payload;
            if (!state.listFilters[page]) return;
            state.listFilters[page].selectedFiscalYear = selectedFiscalYear;
        },
        /**
         * Reset a single list page's filters (and fiscal year) back to its defaults.
         * @param {typeof initialState} state
         * @param {{ payload: { page: string } }} action
         */
        resetListFilters: (state, action) => {
            const { page } = action.payload;
            const def = listFilterDefaults[page];
            if (!def) return;
            state.listFilters[page] = {
                filters: structuredClone(def.filters),
                ...("selectedFiscalYear" in def ? { selectedFiscalYear: def.selectedFiscalYear } : {})
            };
        }
    },
    extraReducers: (builder) => {
        // Single logout-reset hook for all session UI state. All logout
        // call-sites dispatch this same action, so one case covers every path.
        builder.addCase(logout, () => initialState);
    }
});

export { listFilterDefaults };
export const { setTrail, clearTrail, setListFilters, setListFiscalYear, resetListFilters } = sessionUISlice.actions;

export default sessionUISlice.reducer;
