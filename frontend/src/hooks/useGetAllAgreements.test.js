import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGetAllAgreements } from "./useGetAllAgreements";

const useLazyGetAgreementsQueryMock = vi.fn();

vi.mock("../api/opsAPI", () => ({
    useLazyGetAgreementsQuery: (...args) => useLazyGetAgreementsQueryMock(...args)
}));

function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("useGetAllAgreements", () => {
    let triggerMock;

    beforeEach(() => {
        vi.clearAllMocks();
        triggerMock = vi.fn();
        useLazyGetAgreementsQueryMock.mockReturnValue([triggerMock]);
    });

    it("respects skip=true and does not trigger requests", async () => {
        const { result } = renderHook(() => useGetAllAgreements({}, { skip: true }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.agreements).toEqual([]);
        expect(result.current.metadata).toBeNull();
        expect(result.current.isError).toBe(false);
        expect(result.current.error).toBeNull();
        expect(triggerMock).not.toHaveBeenCalled();
    });

    it("fetches a single page when count <= limit", async () => {
        triggerMock.mockImplementation(() => ({
            unwrap: () =>
                Promise.resolve({
                    agreements: [{ id: 1 }, { id: 2 }],
                    count: 2,
                    procurement_overview: { total: 100 },
                    procurement_step_summary: { steps: [] }
                })
        }));

        const { result } = renderHook(() => useGetAllAgreements({ filters: { fiscalYear: [2026] } }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.agreements).toEqual([{ id: 1 }, { id: 2 }]);
        expect(result.current.metadata).toEqual({
            count: 2,
            procurement_overview: { total: 100 },
            procurement_step_summary: { steps: [] }
        });
        expect(result.current.isError).toBe(false);
        expect(triggerMock).toHaveBeenCalledTimes(1);
        expect(triggerMock).toHaveBeenCalledWith(
            expect.objectContaining({
                filters: { fiscalYear: [2026] },
                onlyMy: false,
                sortConditions: "",
                sortDescending: false,
                page: 0,
                limit: 50
            })
        );
    });

    it("fetches multiple pages and flattens in order", async () => {
        triggerMock.mockImplementation(({ page }) => {
            if (page === 0) {
                return {
                    unwrap: () =>
                        Promise.resolve({
                            agreements: [{ id: 1 }, { id: 2 }],
                            count: 120,
                            procurement_overview: { total: 500 }
                        })
                };
            }
            if (page === 1) {
                return { unwrap: () => Promise.resolve({ agreements: [{ id: 3 }] }) };
            }
            return { unwrap: () => Promise.resolve({ agreements: [{ id: 4 }] }) };
        });

        const { result } = renderHook(() => useGetAllAgreements());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.agreements).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
        expect(result.current.metadata).toEqual({ count: 120, procurement_overview: { total: 500 } });
        expect(triggerMock).toHaveBeenCalledTimes(3);
    });

    it("sets error state when first request fails", async () => {
        const error = new Error("first request failed");
        triggerMock.mockImplementation(() => ({
            unwrap: () => Promise.reject(error)
        }));

        const { result } = renderHook(() => useGetAllAgreements());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(error);
        expect(result.current.agreements).toEqual([]);
    });

    it("sets error state when a subsequent page request fails", async () => {
        const error = new Error("page two failed");
        triggerMock.mockImplementation(({ page }) => {
            if (page === 0) {
                return {
                    unwrap: () => Promise.resolve({ agreements: [{ id: 1 }], count: 101 })
                };
            }
            if (page === 1) {
                return { unwrap: () => Promise.reject(error) };
            }
            return { unwrap: () => Promise.resolve({ agreements: [{ id: 3 }] }) };
        });

        const { result } = renderHook(() => useGetAllAgreements());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(error);
    });

    it("forwards explicit params to all page requests", async () => {
        triggerMock.mockImplementation(({ page }) => {
            if (page === 0) {
                return {
                    unwrap: () => Promise.resolve({ agreements: [{ id: "first" }], count: 51 })
                };
            }
            return { unwrap: () => Promise.resolve({ agreements: [{ id: "second" }] }) };
        });

        const params = {
            filters: { agreementType: [{ type: "Contract" }] },
            onlyMy: true,
            sortConditions: "name",
            sortDescending: true
        };

        const { result } = renderHook(() => useGetAllAgreements(params));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(triggerMock).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                filters: params.filters,
                onlyMy: true,
                sortConditions: "name",
                sortDescending: true,
                page: 0,
                limit: 50
            })
        );
        expect(triggerMock).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                filters: params.filters,
                onlyMy: true,
                sortConditions: "name",
                sortDescending: true,
                page: 1,
                limit: 50
            })
        );
        expect(result.current.agreements).toEqual([{ id: "first" }, { id: "second" }]);
    });

    it("guards against updates after unmount (cancellation path)", async () => {
        const deferred = createDeferred();
        triggerMock.mockImplementation(() => ({
            unwrap: () => deferred.promise
        }));

        const { unmount } = renderHook(() => useGetAllAgreements());
        unmount();

        deferred.resolve({ agreements: [{ id: 1 }], count: 1 });
        await Promise.resolve();
        await Promise.resolve();

        expect(triggerMock).toHaveBeenCalledTimes(1);
    });

    it("does not refetch when filter object identity changes but content is equal", async () => {
        triggerMock.mockImplementation(() => ({
            unwrap: () => Promise.resolve({ agreements: [{ id: 1 }], count: 1 })
        }));

        const { rerender } = renderHook(({ params }) => useGetAllAgreements(params), {
            initialProps: {
                params: {
                    filters: { fiscalYear: [{ id: 2026 }] },
                    onlyMy: false,
                    sortConditions: "",
                    sortDescending: false
                }
            }
        });

        await waitFor(() => {
            expect(triggerMock).toHaveBeenCalledTimes(1);
        });

        rerender({
            params: {
                filters: { fiscalYear: [{ id: 2026 }] },
                onlyMy: false,
                sortConditions: "",
                sortDescending: false
            }
        });

        await Promise.resolve();
        expect(triggerMock).toHaveBeenCalledTimes(1);

        rerender({
            params: {
                filters: { fiscalYear: [{ id: 2027 }] },
                onlyMy: false,
                sortConditions: "",
                sortDescending: false
            }
        });

        await waitFor(() => {
            expect(triggerMock).toHaveBeenCalledTimes(2);
        });
    });
});
