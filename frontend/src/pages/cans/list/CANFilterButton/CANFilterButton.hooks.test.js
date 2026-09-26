import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useCANFilterButton from "./CANFilterButton.hooks";

describe("useCANFilterButton", () => {
    const fyBudgetRange = [0, 1000];

    const baseFilters = {
        activePeriod: [{ id: 1, title: "1 Year" }],
        transfer: [{ id: 1, title: "Direct" }],
        portfolio: [{ id: 1, title: "Portfolio A" }],
        can: [{ id: 1, title: "CAN 1" }],
        budget: [100, 500]
    };

    it("reseeds all buffers on open, and Reset fires no query", () => {
        let filters = baseFilters;
        const setFilters = vi.fn();
        const { result, rerender } = renderHook(
            ({ showModal }) => useCANFilterButton(filters, setFilters, fyBudgetRange, showModal),
            { initialProps: { showModal: false } }
        );

        act(() => {
            result.current.resetFilter();
        });
        expect(result.current.activePeriod).toEqual([]);
        expect(result.current.transfer).toEqual([]);
        expect(result.current.portfolio).toEqual([]);
        expect(result.current.can).toEqual([]);
        expect(result.current.budget).toEqual(fyBudgetRange);
        expect(setFilters).not.toHaveBeenCalled();

        // Re-opening the modal must reseed from parent filters, not leave the
        // cleared-but-unapplied Reset state showing.
        rerender({ showModal: true });
        expect(result.current.activePeriod).toEqual(baseFilters.activePeriod);
        expect(result.current.transfer).toEqual(baseFilters.transfer);
        expect(result.current.portfolio).toEqual(baseFilters.portfolio);
        expect(result.current.can).toEqual(baseFilters.can);
        expect(result.current.budget).toEqual(baseFilters.budget);
    });

    it("does not reseed while open, after close, or when filters identity changes", () => {
        let filters = baseFilters;
        const setFilters = vi.fn();
        const { result, rerender } = renderHook(
            ({ showModal }) => useCANFilterButton(filters, setFilters, fyBudgetRange, showModal),
            { initialProps: { showModal: true } }
        );

        act(() => {
            result.current.setCan([]);
        });
        expect(result.current.can).toEqual([]);

        // A brand-new filters object (same values, new identity) must not re-fire the
        // reseed effect while the modal stays open — its deps are [showModal] only.
        filters = { ...baseFilters };
        rerender({ showModal: true });
        expect(result.current.can).toEqual([]);

        rerender({ showModal: false });
        expect(result.current.can).toEqual([]);
    });

    it("applyFilter writes budget: [] when the buffer equals the full range by value", () => {
        // Reference-equality case: buffer is a new array with the same values as fyBudgetRange.
        const setFilters1 = vi.fn();
        const { result: result1 } = renderHook(() => useCANFilterButton(baseFilters, setFilters1, fyBudgetRange, true));
        act(() => {
            result1.current.setBudget([...fyBudgetRange]);
        });
        act(() => {
            result1.current.applyFilter();
        });
        expect(setFilters1.mock.calls[0][0](baseFilters).budget).toEqual([]);

        // Rounding-tolerance case: fyBudgetRange is fractional, buffer is the rounded slider output.
        const roundedRange = [0.9, 110];
        const setFilters2 = vi.fn();
        const { result: result2 } = renderHook(() => useCANFilterButton(baseFilters, setFilters2, roundedRange, true));
        act(() => {
            result2.current.setBudget([1, 110]);
        });
        act(() => {
            result2.current.applyFilter();
        });
        expect(setFilters2.mock.calls[0][0](baseFilters).budget).toEqual([]);

        // Non-finite guard: a NaN pair must never be treated as "full range".
        const nanRange = [NaN, NaN];
        const setFilters3 = vi.fn();
        const { result: result3 } = renderHook(() => useCANFilterButton(baseFilters, setFilters3, nanRange, true));
        act(() => {
            result3.current.setBudget([NaN, NaN]);
        });
        act(() => {
            result3.current.applyFilter();
        });
        expect(setFilters3.mock.calls[0][0](baseFilters).budget).toEqual([NaN, NaN]);
    });

    it("applyFilter commits a narrowed budget and all other buffers", () => {
        const setFilters = vi.fn();
        const { result } = renderHook(() => useCANFilterButton(baseFilters, setFilters, fyBudgetRange, true));

        act(() => {
            result.current.setBudget([100, 500]);
        });
        act(() => {
            result.current.applyFilter();
        });

        expect(setFilters).toHaveBeenCalledTimes(1);
        const updater = setFilters.mock.calls[0][0];
        expect(updater(baseFilters)).toEqual({
            ...baseFilters,
            budget: [100, 500]
        });
    });

    it("applyFilter coalesces a null buffer to []", () => {
        const setFilters = vi.fn();
        const { result } = renderHook(() => useCANFilterButton(baseFilters, setFilters, fyBudgetRange, true));

        act(() => {
            result.current.setActivePeriod(null);
        });
        act(() => {
            result.current.applyFilter();
        });

        const updater = setFilters.mock.calls[0][0];
        expect(updater(baseFilters).activePeriod).toEqual([]);
    });

    it("snaps the budget buffer back to the full range when the budget filter is cleared", () => {
        const setFilters = vi.fn();
        const { result, rerender } = renderHook(
            ({ filters }) => useCANFilterButton(filters, setFilters, fyBudgetRange, true),
            { initialProps: { filters: baseFilters } }
        );

        expect(result.current.budget).toEqual([100, 500]);

        rerender({ filters: { ...baseFilters, budget: [] } });
        expect(result.current.budget).toEqual(fyBudgetRange);
    });
});
