import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGetAllProcurementTrackers } from "./useGetAllProcurementTrackers";

const useLazyGetProcurementTrackersByAgreementIdsQueryMock = vi.fn();

vi.mock("../api/opsAPI", () => ({
    useLazyGetProcurementTrackersByAgreementIdsQuery: (...args) =>
        useLazyGetProcurementTrackersByAgreementIdsQueryMock(...args)
}));

describe("useGetAllProcurementTrackers", () => {
    let triggerMock;

    beforeEach(() => {
        vi.clearAllMocks();
        triggerMock = vi.fn();
        useLazyGetProcurementTrackersByAgreementIdsQueryMock.mockReturnValue([triggerMock]);
    });

    it("respects skip=true and does not trigger requests", async () => {
        const { result } = renderHook(() => useGetAllProcurementTrackers([1, 2, 3], { skip: true }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.procurementTrackers).toEqual([]);
        expect(result.current.isError).toBe(false);
        expect(triggerMock).not.toHaveBeenCalled();
    });

    it("fetches a single batch when ids.length <= 50", async () => {
        const ids = Array.from({ length: 10 }, (_, i) => i + 1);
        triggerMock.mockImplementation(() => ({
            unwrap: () => Promise.resolve([{ agreement_id: 1, active_step_number: 2 }])
        }));

        const { result } = renderHook(() => useGetAllProcurementTrackers(ids));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.procurementTrackers).toEqual([{ agreement_id: 1, active_step_number: 2 }]);
        expect(triggerMock).toHaveBeenCalledTimes(1);
        expect(triggerMock).toHaveBeenCalledWith(ids);
    });

    it("splits into multiple batches for >50 ids and merges results", async () => {
        const ids = Array.from({ length: 120 }, (_, i) => i + 1);
        triggerMock.mockImplementation((batch) => ({
            unwrap: () => Promise.resolve([{ agreement_id: batch[0], active_step_number: 1 }])
        }));

        const { result } = renderHook(() => useGetAllProcurementTrackers(ids));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(triggerMock).toHaveBeenCalledTimes(3);
        expect(triggerMock).toHaveBeenNthCalledWith(1, ids.slice(0, 50));
        expect(triggerMock).toHaveBeenNthCalledWith(2, ids.slice(50, 100));
        expect(triggerMock).toHaveBeenNthCalledWith(3, ids.slice(100, 120));
        expect(result.current.procurementTrackers).toHaveLength(3);
    });

    it("sets error state when a request fails", async () => {
        const error = new Error("request failed");
        triggerMock.mockImplementation(() => ({
            unwrap: () => Promise.reject(error)
        }));

        const { result } = renderHook(() => useGetAllProcurementTrackers([1, 2]));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(error);
    });

    it("resolves to empty without triggering requests when given an empty array", async () => {
        const { result } = renderHook(() => useGetAllProcurementTrackers([]));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.procurementTrackers).toEqual([]);
        expect(result.current.isError).toBe(false);
        expect(triggerMock).not.toHaveBeenCalled();
    });

    it("guards against state updates after unmount", async () => {
        let resolve;
        const deferred = new Promise((res) => {
            resolve = res;
        });
        triggerMock.mockImplementation(() => ({
            unwrap: () => deferred
        }));

        const { unmount } = renderHook(() => useGetAllProcurementTrackers([1, 2]));
        unmount();

        resolve([{ agreement_id: 1, active_step_number: 1 }]);
        await Promise.resolve();
        await Promise.resolve();

        expect(triggerMock).toHaveBeenCalledTimes(1);
    });

    it("does not refetch when array identity changes but content is equal", async () => {
        triggerMock.mockImplementation(() => ({
            unwrap: () => Promise.resolve([{ agreement_id: 1, active_step_number: 1 }])
        }));

        const { rerender } = renderHook(({ ids }) => useGetAllProcurementTrackers(ids), {
            initialProps: { ids: [1, 2, 3] }
        });

        await waitFor(() => {
            expect(triggerMock).toHaveBeenCalledTimes(1);
        });

        rerender({ ids: [1, 2, 3] });
        await Promise.resolve();
        expect(triggerMock).toHaveBeenCalledTimes(1);
    });
});
