import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, it, expect } from "vitest";
import { setupStore } from "../store";
import { logout } from "../components/Auth/authSlice";
import { listFilterDefaults } from "../sessionUISlice";
import { useListFilters } from "./useListFilters.hooks";

/**
 * Render useListFilters against a shared store instance so we can simulate an
 * unmount/remount (navigate away and back) within one session.
 */
const renderWithStore = (page, store) => {
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    return renderHook(() => useListFilters(page), { wrapper });
};

describe("useListFilters", () => {
    it("returns the page's default filters initially", () => {
        const store = setupStore();
        const { result } = renderWithStore("cans", store);
        expect(result.current.filters).toEqual(listFilterDefaults.cans.filters);
        expect(result.current.selectedFiscalYear).toEqual(listFilterDefaults.cans.selectedFiscalYear);
    });

    it("accepts an object update", () => {
        const store = setupStore();
        const { result } = renderWithStore("cans", store);
        const next = { ...listFilterDefaults.cans.filters, can: [{ id: 7, title: "C7" }] };
        act(() => result.current.setFilters(next));
        expect(result.current.filters).toEqual(next);
    });

    it("accepts a functional updater resolved against the latest state", () => {
        const store = setupStore();
        const { result } = renderWithStore("agreements", store);
        act(() => result.current.setFilters((prev) => ({ ...prev, portfolio: [{ id: 1 }] })));
        act(() => result.current.setFilters((prev) => ({ ...prev, agreementType: [{ id: 2 }] })));
        // Both updates compose — the second updater saw the first's result.
        expect(result.current.filters.portfolio).toEqual([{ id: 1 }]);
        expect(result.current.filters.agreementType).toEqual([{ id: 2 }]);
    });

    it("persists filters + fiscal year across unmount/remount within a session", () => {
        const store = setupStore();
        const { result: resultBefore, unmount } = renderWithStore("cans", store);
        act(() => resultBefore.current.setFilters((prev) => ({ ...prev, can: [{ id: 9 }] })));
        act(() => resultBefore.current.setSelectedFiscalYear(2031));
        // Navigate away.
        unmount();

        // Return to the list (fresh mount, same store).
        const { result: resultAfter } = renderWithStore("cans", store);
        expect(resultAfter.current.filters.can).toEqual([{ id: 9 }]);
        expect(resultAfter.current.selectedFiscalYear).toBe(2031);
    });

    it("clears persisted filters on logout", () => {
        const store = setupStore();
        const { result, rerender } = renderWithStore("cans", store);
        act(() => result.current.setFilters((prev) => ({ ...prev, can: [{ id: 9 }] })));
        act(() => {
            store.dispatch(logout());
        });
        rerender();
        expect(result.current.filters).toEqual(listFilterDefaults.cans.filters);
    });

    it("keeps each page's filters independent", () => {
        const store = setupStore();
        const { result: resultCans } = renderWithStore("cans", store);
        const { result: resultAgreements } = renderWithStore("agreements", store);
        act(() => resultCans.current.setFilters((prev) => ({ ...prev, can: [{ id: 1 }] })));
        expect(resultAgreements.current.filters).toEqual(listFilterDefaults.agreements.filters);
    });
});
