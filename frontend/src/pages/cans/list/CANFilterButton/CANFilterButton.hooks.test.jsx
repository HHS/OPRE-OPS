import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useCANFilterButton } from "./CANFilterButton.hooks";

/**
 * Regression test for the budget-clear bug: when the pending budget equals the
 * full available range, applyFilter must CLEAR the persisted budget filter
 * (set it to []), not silently retain the previous value via `...prevState`.
 */
describe("useCANFilterButton — applyFilter budget handling", () => {
    const fyBudgetRange = [0, 100];

    it("clears the budget filter when the selected range equals the full available range", () => {
        // Persisted filters already contain a narrower budget from a prior apply.
        const filters = { activePeriod: [], transfer: [], portfolio: [], can: [], budget: [10, 50] };
        const setFilters = vi.fn();

        const { result } = renderHook(() => useCANFilterButton(filters, setFilters, fyBudgetRange));

        // The effect seeds `budget` to fyBudgetRange, then filters.budget ([10,50]) wins.
        // Simulate the user dragging the slider back to the full range.
        act(() => result.current.setBudget(fyBudgetRange));
        act(() => result.current.applyFilter());

        // setFilters is called with a functional updater; resolve it against prev state.
        const updater = setFilters.mock.calls.at(-1)[0];
        const next = typeof updater === "function" ? updater(filters) : updater;
        expect(next.budget).toEqual([]); // cleared, not [10,50]
    });

    it("applies the budget filter when a narrower range is selected", () => {
        const filters = { activePeriod: [], transfer: [], portfolio: [], can: [], budget: [] };
        const setFilters = vi.fn();

        const { result } = renderHook(() => useCANFilterButton(filters, setFilters, fyBudgetRange));

        act(() => result.current.setBudget([20, 80]));
        act(() => result.current.applyFilter());

        const updater = setFilters.mock.calls.at(-1)[0];
        const next = typeof updater === "function" ? updater(filters) : updater;
        expect(next.budget).toEqual([20, 80]);
    });
});
