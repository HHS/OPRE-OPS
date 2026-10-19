import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./components/Auth/authSlice";
import { getCurrentFiscalYear } from "./helpers/utils";
import { DEFAULT_PORTFOLIO_BUDGET_RANGE } from "./constants";

/**
 * Session-scoped UI state that survives client-side navigation and tab switches
 * but is intentionally lost on browser refresh / new tab (in-memory Redux) and
 * cleared on logout.
 *
 * `listFilters` holds per-page filter + fiscal-year selections that persist
 * across client-side navigation, so a user returning to a list via breadcrumb
 * keeps their filters applied. (Breadcrumb trails themselves travel as router
 * location state; see `helpers/breadcrumb.helpers.js`.)
 */

/**
 * Per-page default filter state. Each shape is copied VERBATIM from the list
 * page's original `useState` initializer so behavior is unchanged on first
 * load. `selectedFiscalYear` is persisted alongside `filters` because the
 * resolved query blends both — persisting only `filters` would silently reset
 * the fiscal year on return. A function default (`getCurrentFiscalYear`) is
 * evaluated whenever state is built, so it stays current across Oct 1.
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
        selectedFiscalYear: "All"
    },
    cans: {
        filters: {
            activePeriod: [],
            transfer: [],
            portfolio: [],
            can: [],
            budget: []
        },
        selectedFiscalYear: getCurrentFiscalYear
    },
    budgetLines: {
        filters: {
            fiscalYears: [],
            portfolios: [],
            bliStatus: [],
            budgetRange: null,
            agreementTypes: [],
            agreementTitles: [],
            canActivePeriods: []
        },
        selectedFiscalYear: "All"
    },
    portfolios: {
        filters: {
            portfolios: [],
            budgetRange: DEFAULT_PORTFOLIO_BUDGET_RANGE,
            availablePct: []
        },
        selectedFiscalYear: getCurrentFiscalYear
    },
    projects: {
        filters: {
            fiscalYear: [],
            portfolio: [],
            projectSearch: [],
            agreementSearch: [],
            projectType: []
        },
        selectedFiscalYear: "All"
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
 * Build a fresh per-page state entry from its default. Deep-clones `filters`
 * so the exported defaults are never mutated (by Immer freezing or otherwise),
 * and includes `selectedFiscalYear` only for pages that have a page-level FY.
 * Single source of truth for both initial-state construction and reset.
 * @param {{filters: Object, selectedFiscalYear?: string|number|(() => string)}} def
 * @returns {{filters: Object, selectedFiscalYear?: string|number}}
 */
const buildPageState = (def) => ({
    filters: structuredClone(def.filters),
    ...("selectedFiscalYear" in def
        ? {
              selectedFiscalYear:
                  typeof def.selectedFiscalYear === "function" ? def.selectedFiscalYear() : def.selectedFiscalYear
          }
        : {})
});

/**
 * Build the initial listFilters state from the per-page defaults.
 * @returns {Record<string, {filters: Object, selectedFiscalYear?: string|number}>}
 */
const buildListFiltersInitialState = () =>
    Object.fromEntries(Object.entries(listFilterDefaults).map(([page, def]) => [page, buildPageState(def)]));

/** @returns {{ listFilters: ReturnType<typeof buildListFiltersInitialState> }} */
const buildInitialState = () => ({
    listFilters: buildListFiltersInitialState()
});

const sessionUISlice = createSlice({
    name: "sessionUI",
    // Lazy, so the current-FY defaults are computed when the store is created.
    initialState: buildInitialState,
    reducers: {
        /**
         * Replace the applied filters for a list page.
         * @param {ReturnType<typeof buildInitialState>} state
         * @param {{ payload: { page: string, filters: Object } }} action
         */
        setListFilters: (state, action) => {
            const { page, filters } = action.payload;
            if (!state.listFilters[page]) return;
            state.listFilters[page].filters = filters;
        },
        /**
         * Set the selected fiscal year for a list page.
         * @param {ReturnType<typeof buildInitialState>} state
         * @param {{ payload: { page: string, selectedFiscalYear: string|number } }} action
         */
        setListFiscalYear: (state, action) => {
            const { page, selectedFiscalYear } = action.payload;
            if (!state.listFilters[page]) return;
            state.listFilters[page].selectedFiscalYear = selectedFiscalYear;
        },
        /**
         * Set a list page's fiscal year and reset its other filters to defaults,
         * for pages where changing the FY starts over (Portfolios).
         * @param {ReturnType<typeof buildInitialState>} state
         * @param {{ payload: { page: string, selectedFiscalYear: string|number } }} action
         */
        changeListFiscalYear: (state, action) => {
            const { page, selectedFiscalYear } = action.payload;
            const def = listFilterDefaults[page];
            if (!def) return;
            state.listFilters[page] = { ...buildPageState(def), selectedFiscalYear };
        }
    },
    extraReducers: (builder) => {
        // Single logout-reset hook for all session UI state. All logout
        // call-sites dispatch this same action, so one case covers every path.
        builder.addCase(logout, () => buildInitialState());
    }
});

export { listFilterDefaults };
export const { setListFilters, setListFiscalYear, changeListFiscalYear } = sessionUISlice.actions;

export default sessionUISlice.reducer;
