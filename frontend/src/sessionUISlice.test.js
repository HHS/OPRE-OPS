import { describe, expect, it, vi } from "vitest";
import { getCurrentFiscalYear } from "./helpers/utils";
import sessionUIReducer, {
    setListFilters,
    setListFiscalYear,
    changeListFiscalYear,
    listFilterDefaults
} from "./sessionUISlice";
import { logout } from "./components/Auth/authSlice";

// The reducer's initial state is derived from the slice defaults; build the
// expected shape the same way so the test doesn't duplicate literals.
const freshState = () => sessionUIReducer(undefined, { type: "@@INIT" });

describe("sessionUISlice — initial state", () => {
    it("returns the per-page filter defaults", () => {
        const state = freshState();
        expect(state.listFilters.agreements.filters).toEqual(listFilterDefaults.agreements.filters);
        expect(state.listFilters.cans.selectedFiscalYear).toEqual(getCurrentFiscalYear());
        expect(state.listFilters.budgetLines.selectedFiscalYear).toBe("All");
        expect(state.listFilters.agreements.selectedFiscalYear).toBe("All");
        expect(state.listFilters.projects.selectedFiscalYear).toBe("All");
        expect(state.listFilters.procurementDashboard.selectedFiscalYear).toBeUndefined();
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

    it("setListFiscalYear ignores an unknown page", () => {
        const before = freshState();
        const after = sessionUIReducer(before, setListFiscalYear({ page: "nope", selectedFiscalYear: 2030 }));
        expect(after.listFilters).toEqual(before.listFilters);
    });

    it("changeListFiscalYear ignores an unknown page", () => {
        const before = freshState();
        const after = sessionUIReducer(before, changeListFiscalYear({ page: "nope", selectedFiscalYear: 2030 }));
        expect(after.listFilters).toEqual(before.listFilters);
    });

    it("setListFiscalYear updates only the target page's fiscal year", () => {
        const state = sessionUIReducer(freshState(), setListFiscalYear({ page: "cans", selectedFiscalYear: 2030 }));
        expect(state.listFilters.cans.selectedFiscalYear).toBe(2030);
        expect(state.listFilters.agreements.selectedFiscalYear).toBe(listFilterDefaults.agreements.selectedFiscalYear);
    });

    it("changeListFiscalYear sets the fiscal year and resets the page's filters", () => {
        let state = sessionUIReducer(
            freshState(),
            setListFilters({
                page: "portfolios",
                filters: { ...listFilterDefaults.portfolios.filters, portfolios: [{ id: 9 }] }
            })
        );
        state = sessionUIReducer(state, changeListFiscalYear({ page: "portfolios", selectedFiscalYear: 2040 }));
        expect(state.listFilters.portfolios).toEqual({
            filters: listFilterDefaults.portfolios.filters,
            selectedFiscalYear: 2040
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
    it("resets ALL session UI state on logout", () => {
        let state = sessionUIReducer(
            freshState(),
            setListFilters({ page: "agreements", filters: { portfolio: [{ id: 1 }] } })
        );
        state = sessionUIReducer(state, logout());
        expect(state).toEqual(freshState());
        expect(state.listFilters.agreements.filters).toEqual(listFilterDefaults.agreements.filters);
    });

    it("recomputes the current-FY default on logout rather than at module load", () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(new Date("2031-11-01T12:00:00Z"));
            const state = sessionUIReducer(freshState(), logout());
            expect(state.listFilters.cans.selectedFiscalYear).toBe("2032");
            expect(state.listFilters.portfolios.selectedFiscalYear).toBe("2032");
        } finally {
            vi.useRealTimers();
        }
    });
});
