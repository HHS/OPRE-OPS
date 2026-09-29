import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useProjectFilterButton from "./ProjectFilterButton.hooks";

describe("useProjectFilterButton", () => {
    const baseFilters = {
        fiscalYear: [],
        portfolio: [],
        projectSearch: [],
        agreementSearch: [],
        projectType: []
    };

    it("reseeds local buffers from parent filters when the modal opens", () => {
        const filters = { ...baseFilters, portfolio: [{ id: 1, name: "Portfolio A" }] };
        const setFilters = vi.fn();
        const { result, rerender } = renderHook(
            ({ showModal }) => useProjectFilterButton(filters, setFilters, showModal),
            { initialProps: { showModal: false } }
        );

        expect(result.current.portfolio).toEqual([{ id: 1, name: "Portfolio A" }]);

        // Reset without applying: local buffer clears, parent filters untouched.
        act(() => {
            result.current.resetFilter();
        });
        expect(result.current.portfolio).toEqual([]);
        expect(setFilters).not.toHaveBeenCalled();

        // Re-opening the modal (showModal: false -> true) must reseed from parent
        // filters, not leave the buffer in the cleared-but-unapplied state.
        rerender({ showModal: true });
        expect(result.current.portfolio).toEqual([{ id: 1, name: "Portfolio A" }]);
    });

    it("does not reseed while the modal stays open or after it closes", () => {
        const filters = { ...baseFilters, projectType: [{ id: 1, title: "RESEARCH" }] };
        const setFilters = vi.fn();
        const { result, rerender } = renderHook(
            ({ showModal }) => useProjectFilterButton(filters, setFilters, showModal),
            { initialProps: { showModal: true } }
        );

        act(() => {
            result.current.setProjectType([]);
        });
        expect(result.current.projectType).toEqual([]);

        // Re-render with showModal still true: no reseed effect should re-fire.
        rerender({ showModal: true });
        expect(result.current.projectType).toEqual([]);

        // Closing the modal should not reseed either — only the true transition does.
        rerender({ showModal: false });
        expect(result.current.projectType).toEqual([]);
    });

    it("resetFilter clears every local buffer without calling setFilters", () => {
        const filters = {
            fiscalYear: [{ id: 2024, title: 2024 }],
            portfolio: [{ id: 1, name: "Portfolio A" }],
            projectSearch: [{ id: 1, title: "Project A" }],
            agreementSearch: [{ id: 1, title: "Agreement A" }],
            projectType: [{ id: 1, title: "RESEARCH" }]
        };
        const setFilters = vi.fn();
        const { result } = renderHook(() => useProjectFilterButton(filters, setFilters, true));

        act(() => {
            result.current.resetFilter();
        });

        expect(result.current.fiscalYear).toEqual([]);
        expect(result.current.portfolio).toEqual([]);
        expect(result.current.projectSearch).toEqual([]);
        expect(result.current.agreementSearch).toEqual([]);
        expect(result.current.projectType).toEqual([]);
        // Reset must not fire a query — it only takes effect once Apply is clicked.
        expect(setFilters).not.toHaveBeenCalled();
    });

    it("applyFilter pushes the current local buffers into parent filters", () => {
        const setFilters = vi.fn();
        const { result } = renderHook(() => useProjectFilterButton(baseFilters, setFilters, true));

        act(() => {
            result.current.setPortfolio([{ id: 2, name: "Portfolio B" }]);
        });
        act(() => {
            result.current.applyFilter();
        });

        expect(setFilters).toHaveBeenCalledTimes(1);
        const updater = setFilters.mock.calls[0][0];
        expect(updater(baseFilters)).toEqual({
            ...baseFilters,
            portfolio: [{ id: 2, name: "Portfolio B" }]
        });
    });
});
