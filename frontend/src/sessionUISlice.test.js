import { describe, expect, it } from "vitest";
import sessionUIReducer, {
    setTrail,
    clearTrail,
    setListFilters,
    setListFiscalYear,
    resetListFilters,
    listFilterDefaults
} from "./sessionUISlice";
import { logout } from "./components/Auth/authSlice";

// The reducer's initial state is derived from the slice defaults; build the
// expected shape the same way so the test doesn't duplicate literals.
const freshState = () => sessionUIReducer(undefined, { type: "@@INIT" });

describe("sessionUISlice — navContext", () => {
    it("returns the initial state with a null trail and per-page filter defaults", () => {
        const state = freshState();
        expect(state.navContext.trail).toBeNull();
        expect(state.listFilters.agreements.filters).toEqual(listFilterDefaults.agreements.filters);
        expect(state.listFilters.cans.selectedFiscalYear).toEqual(listFilterDefaults.cans.selectedFiscalYear);
        expect(state.listFilters.budgetLines).not.toHaveProperty("selectedFiscalYear");
        expect(state.listFilters.procurementDashboard).not.toHaveProperty("selectedFiscalYear");
    });

    it("setTrail stores the trail", () => {
        const trail = {
            targetPath: "/agreements/1",
            ancestors: [
                { label: "Portfolios", to: "/portfolios" },
                { label: "Portfolio A", to: "/portfolios/5" }
            ]
        };
        const state = sessionUIReducer(freshState(), setTrail(trail));
        expect(state.navContext.trail).toEqual(trail);
    });

    it("setTrail overwrites a previously stored trail", () => {
        const first = { targetPath: "/cans/1", ancestors: [{ label: "CANs", to: "/cans" }] };
        const second = { targetPath: "/agreements/2", ancestors: [{ label: "Agreements", to: "/agreements" }] };
        let state = sessionUIReducer(freshState(), setTrail(first));
        state = sessionUIReducer(state, setTrail(second));
        expect(state.navContext.trail).toEqual(second);
    });

    it("clearTrail resets the trail to null", () => {
        let state = sessionUIReducer(
            freshState(),
            setTrail({ targetPath: "/cans/1", ancestors: [{ label: "CANs", to: "/cans" }] })
        );
        state = sessionUIReducer(state, clearTrail());
        expect(state.navContext.trail).toBeNull();
    });
});

describe("sessionUISlice — listFilters", () => {
    it("setListFilters replaces the filters for a page", () => {
        const next = { ...listFilterDefaults.agreements.filters, portfolio: [{ id: 1, title: "P1" }] };
        const state = sessionUIReducer(freshState(), setListFilters({ page: "agreements", filters: next }));
        expect(state.listFilters.agreements.filters).toEqual(next);
    });

    it("setListFilters ignores an unknown page", () => {
        const before = freshState();
        const after = sessionUIReducer(before, setListFilters({ page: "nope", filters: { a: 1 } }));
        expect(after.listFilters).toEqual(before.listFilters);
    });

    it("setListFiscalYear updates only the target page's fiscal year", () => {
        const state = sessionUIReducer(freshState(), setListFiscalYear({ page: "cans", selectedFiscalYear: 2030 }));
        expect(state.listFilters.cans.selectedFiscalYear).toBe(2030);
        expect(state.listFilters.agreements.selectedFiscalYear).toBe(listFilterDefaults.agreements.selectedFiscalYear);
    });

    it("resetListFilters restores a page to its defaults", () => {
        let state = sessionUIReducer(
            freshState(),
            setListFilters({ page: "cans", filters: { ...listFilterDefaults.cans.filters, can: [{ id: 9 }] } })
        );
        state = sessionUIReducer(state, setListFiscalYear({ page: "cans", selectedFiscalYear: 2040 }));
        state = sessionUIReducer(state, resetListFilters({ page: "cans" }));
        expect(state.listFilters.cans).toEqual({
            filters: listFilterDefaults.cans.filters,
            selectedFiscalYear: listFilterDefaults.cans.selectedFiscalYear
        });
    });

    it("does not share references between the store and the exported defaults", () => {
        const state = sessionUIReducer(freshState(), setListFilters({ page: "cans", filters: { can: [{ id: 1 }] } }));
        // mutating the store's filters must not touch the exported defaults
        expect(listFilterDefaults.cans.filters.can).toEqual([]);
        expect(state.listFilters.cans.filters.can).toEqual([{ id: 1 }]);
    });
});

describe("sessionUISlice — logout reset", () => {
    it("resets ALL session UI state (trail + filters) on logout", () => {
        let state = sessionUIReducer(
            freshState(),
            setTrail({ targetPath: "/cans/1", ancestors: [{ label: "CANs", to: "/cans" }] })
        );
        state = sessionUIReducer(state, setListFilters({ page: "agreements", filters: { portfolio: [{ id: 1 }] } }));
        state = sessionUIReducer(state, logout());
        expect(state).toEqual(freshState());
        expect(state.navContext.trail).toBeNull();
        expect(state.listFilters.agreements.filters).toEqual(listFilterDefaults.agreements.filters);
    });
});
