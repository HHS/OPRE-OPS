import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useAgreementsFilterButton from "./AgreementsFilterButton.hooks";

describe("useAgreementsFilterButton", () => {
    const baseFilters = {
        fiscalYear: [],
        portfolio: [],
        projectTitle: [],
        agreementType: [],
        agreementName: [],
        contractNumber: [],
        awardType: []
    };

    it("reseeds local buffers from parent filters when the modal opens", () => {
        const filters = { ...baseFilters, portfolio: [{ id: 1, title: "Portfolio A" }] };
        const setFilters = vi.fn();
        const { result, rerender } = renderHook(
            ({ showModal }) => useAgreementsFilterButton(filters, setFilters, showModal),
            { initialProps: { showModal: false } }
        );

        expect(result.current.portfolio).toEqual([{ id: 1, title: "Portfolio A" }]);

        // Reset without applying: local buffer clears, parent filters untouched.
        act(() => {
            result.current.resetFilter();
        });
        expect(result.current.portfolio).toEqual([]);
        expect(setFilters).not.toHaveBeenCalled();

        // Re-opening the modal (showModal: false -> true) must reseed from parent
        // filters, not leave the buffer in the cleared-but-unapplied state.
        rerender({ showModal: true });
        expect(result.current.portfolio).toEqual([{ id: 1, title: "Portfolio A" }]);
    });

    it("does not reseed while the modal stays open or after it closes", () => {
        const filters = { ...baseFilters, agreementType: [{ id: 1, title: "Contract" }] };
        const setFilters = vi.fn();
        const { result, rerender } = renderHook(
            ({ showModal }) => useAgreementsFilterButton(filters, setFilters, showModal),
            { initialProps: { showModal: true } }
        );

        act(() => {
            result.current.setAgreementType([]);
        });
        expect(result.current.agreementType).toEqual([]);

        // Re-render with showModal still true: no reseed effect should re-fire.
        rerender({ showModal: true });
        expect(result.current.agreementType).toEqual([]);

        // Closing the modal should not reseed either — only the true transition does.
        rerender({ showModal: false });
        expect(result.current.agreementType).toEqual([]);
    });

    it("resetFilter clears every local buffer without calling setFilters", () => {
        const filters = {
            fiscalYear: [{ id: 2024, title: 2024 }],
            portfolio: [{ id: 1, title: "Portfolio A" }],
            projectTitle: [{ id: 1, title: "Project A" }],
            agreementType: [{ id: 1, title: "Contract" }],
            agreementName: [{ id: 1, title: "Agreement A" }],
            contractNumber: [{ id: 1, title: "12345" }],
            awardType: [{ id: 1, title: "SOLE_SOURCE" }]
        };
        const setFilters = vi.fn();
        const { result } = renderHook(() => useAgreementsFilterButton(filters, setFilters, true));

        act(() => {
            result.current.resetFilter();
        });

        expect(result.current.fiscalYear).toEqual([]);
        expect(result.current.portfolio).toEqual([]);
        expect(result.current.projectTitle).toEqual([]);
        expect(result.current.agreementType).toEqual([]);
        expect(result.current.agreementName).toEqual([]);
        expect(result.current.contractNumber).toEqual([]);
        expect(result.current.awardType).toEqual([]);
        // Reset must not fire a query — it only takes effect once Apply is clicked.
        expect(setFilters).not.toHaveBeenCalled();
    });

    it("applyFilter pushes the current local buffers into parent filters", () => {
        const setFilters = vi.fn();
        const { result } = renderHook(() => useAgreementsFilterButton(baseFilters, setFilters, true));

        act(() => {
            result.current.setPortfolio([{ id: 2, title: "Portfolio B" }]);
        });
        act(() => {
            result.current.applyFilter();
        });

        expect(setFilters).toHaveBeenCalledTimes(1);
        const updater = setFilters.mock.calls[0][0];
        expect(updater(baseFilters)).toEqual({
            ...baseFilters,
            portfolio: [{ id: 2, title: "Portfolio B" }]
        });
    });

    describe("applyFiredFYRef seam", () => {
        it("sets the ref when Apply actually changes the fiscalYear buffer", () => {
            const setFilters = vi.fn();
            const applyFiredFYRef = { current: false };
            const { result } = renderHook(() =>
                useAgreementsFilterButton(baseFilters, setFilters, true, applyFiredFYRef)
            );

            act(() => {
                result.current.setFiscalYear([{ id: 2024, title: 2024 }]);
            });
            act(() => {
                result.current.applyFilter();
            });

            expect(applyFiredFYRef.current).toBe(true);
        });

        it("does not set the ref when Apply writes back the same fiscalYear reference", () => {
            // Regression guard for the stuck-ref bug: if the FY buffer is untouched (same
            // reference as filters.fiscalYear), the page-level effect keyed on
            // filters.fiscalYear never re-runs to clear the ref. Setting it anyway leaves
            // it stuck "true" and wrongly suppresses a later, unrelated tag-removal reset.
            const filters = { ...baseFilters, fiscalYear: [{ id: 2024, title: 2024 }] };
            const setFilters = vi.fn();
            const applyFiredFYRef = { current: false };
            const { result } = renderHook(() => useAgreementsFilterButton(filters, setFilters, true, applyFiredFYRef));

            // Change an unrelated filter only — leave fiscalYear untouched.
            act(() => {
                result.current.setPortfolio([{ id: 2, title: "Portfolio B" }]);
            });
            act(() => {
                result.current.applyFilter();
            });

            expect(setFilters).toHaveBeenCalledTimes(1);
            expect(applyFiredFYRef.current).toBe(false);
        });
    });
});
