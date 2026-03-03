// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGetAllAgreements } from "./useGetAllAgreements";
import { useLazyGetAgreementsQuery } from "../api/opsAPI";

vi.mock("../api/opsAPI", () => ({
    useLazyGetAgreementsQuery: vi.fn()
}));

describe("useGetAllAgreements", () => {
    const triggerMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useLazyGetAgreementsQuery.mockReturnValue([triggerMock]);
    });

    it("short-circuits when skip=true", () => {
        const { result } = renderHook(() => useGetAllAgreements({}, { skip: true }));

        expect(result.current.isLoading).toBe(false);
        expect(result.current.agreements).toEqual([]);
        expect(result.current.isError).toBe(false);
        expect(triggerMock).not.toHaveBeenCalled();
    });

    it("returns first page only when count <= page size", async () => {
        triggerMock.mockImplementation(({ page }) => ({
            unwrap: () =>
                Promise.resolve({
                    agreements: [{ id: 1, display_name: `A-${page}` }],
                    count: 1
                })
        }));

        const { result } = renderHook(() =>
            useGetAllAgreements({
                filters: { fiscalYear: [{ title: "FY 2026" }] },
                onlyMy: true,
                sortConditions: "name",
                sortDescending: false
            })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isError).toBe(false);
        expect(result.current.agreements).toEqual([{ id: 1, display_name: "A-0" }]);
        expect(triggerMock).toHaveBeenCalledTimes(1);
        expect(triggerMock).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 0,
                limit: 50,
                onlyMy: true,
                sortConditions: "name"
            })
        );
    });

    it("fetches and merges multiple pages in order", async () => {
        triggerMock.mockImplementation(({ page }) => ({
            unwrap: () =>
                Promise.resolve({
                    agreements: [{ id: page + 1, display_name: `Agreement-${page}` }],
                    count: 120
                })
        }));

        const { result } = renderHook(() =>
            useGetAllAgreements({
                filters: {},
                onlyMy: false,
                sortConditions: "",
                sortDescending: false
            })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(triggerMock).toHaveBeenCalledTimes(3);
        expect(result.current.agreements).toEqual([
            { id: 1, display_name: "Agreement-0" },
            { id: 2, display_name: "Agreement-1" },
            { id: 3, display_name: "Agreement-2" }
        ]);
    });

    it("sets error state when request fails", async () => {
        const error = new Error("boom");
        triggerMock.mockImplementation(() => ({
            unwrap: () => Promise.reject(error)
        }));

        const { result } = renderHook(() => useGetAllAgreements({ filters: {} }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(error);
        expect(result.current.agreements).toEqual([]);
    });

    it("ignores late responses after unmount (cancel guard)", async () => {
        let resolveFirstPage;
        const firstPagePromise = new Promise((resolve) => {
            resolveFirstPage = resolve;
        });
        triggerMock.mockImplementation(() => ({
            unwrap: () => firstPagePromise
        }));

        const { unmount } = renderHook(() => useGetAllAgreements({ filters: {} }));
        unmount();

        await resolveFirstPage({ agreements: [{ id: 1 }], count: 1 });
        await Promise.resolve();

        expect(triggerMock).toHaveBeenCalledTimes(1);
    });

    it("re-fetches when dependency inputs change", async () => {
        triggerMock.mockImplementation(({ page, sortConditions }) => ({
            unwrap: () =>
                Promise.resolve({
                    agreements: [{ id: page, sortConditions }],
                    count: 1
                })
        }));

        const initialProps = {
            params: { filters: { status: ["DRAFT"] }, onlyMy: false, sortConditions: "", sortDescending: false },
            options: { skip: false }
        };
        const { rerender } = renderHook(({ params, options }) => useGetAllAgreements(params, options), {
            initialProps
        });

        await waitFor(() => expect(triggerMock).toHaveBeenCalledTimes(1));

        rerender({
            params: { ...initialProps.params, sortConditions: "name" },
            options: { skip: false }
        });

        await waitFor(() => expect(triggerMock).toHaveBeenCalledTimes(2));
    });
});
