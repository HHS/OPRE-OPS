import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./components/Auth/authSlice";

/**
 * Session-scoped UI state that survives client-side navigation and tab switches
 * but is intentionally lost on browser refresh / new tab (in-memory Redux) and
 * cleared on logout.
 *
 * Deliverable A (breadcrumbs) uses `navContext.trail`.
 * Deliverable B (filter persistence) will add a `listFilters` sub-state here so
 * there is a single logout-reset hook for all session UI state.
 *
 * @typedef {Object} BreadcrumbAncestor
 * @property {string} label - The crumb text.
 * @property {string} to - The path the crumb links to.
 *
 * @typedef {Object} BreadcrumbTrail
 * @property {string} targetPath - Destination base pathname the trail applies to (e.g. "/agreements/123").
 * @property {BreadcrumbAncestor[]} ancestors - Crumbs shown before the leaf, in order.
 */

const initialState = {
    navContext: {
        /** @type {BreadcrumbTrail | null} */
        trail: null
    }
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
        }
    },
    extraReducers: (builder) => {
        // Single logout-reset hook for all session UI state. All logout
        // call-sites dispatch this same action, so one case covers every path.
        builder.addCase(logout, () => initialState);
    }
});

export const { setTrail, clearTrail } = sessionUISlice.actions;

export default sessionUISlice.reducer;
