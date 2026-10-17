import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useHeaderSearch, { SEARCH_STATUS } from "./HeaderSearch.hooks";

// The network layer is replaced by a hand-driven fake so each test controls exactly when (and in
// which order) responses settle, and whether abort() actually stops anything.
const mockTrigger = vi.fn();
vi.mock("../../../../api/opsAPI", () => ({
    useLazySearchAgreementsQuery: () => [mockTrigger]
}));

/** A request whose outcome the test settles by hand. */
const deferredRequest = () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { unwrap: () => promise, abort: vi.fn(), resolve, reject };
};

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

const type = (result, value) => act(() => result.current.handleChange({ target: { value } }));
const flushDebounce = () => act(() => vi.advanceTimersByTimeAsync(300));
const settle = (request, value) =>
    act(async () => {
        if (value instanceof Error) {
            request.reject(value);
        } else {
            request.resolve(value);
        }
        // Let the hook's await continuation run inside act.
        await request.unwrap().catch(() => {});
        await Promise.resolve();
    });

describe("useHeaderSearch request lifecycle", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockTrigger.mockReset();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("triggers a fresh five-row query from offset 0", async () => {
        mockTrigger.mockReturnValue(deferredRequest());
        const { result } = renderHook(() => useHeaderSearch(), { wrapper });

        await type(result, "ab");
        expect(mockTrigger).not.toHaveBeenCalled();
        await flushDebounce();

        expect(mockTrigger).toHaveBeenCalledWith({ q: "ab", limit: 5, offset: 0 }, false);
    });

    it("aborts the previous request when a new search starts", async () => {
        const first = deferredRequest();
        mockTrigger.mockReturnValueOnce(first).mockReturnValueOnce(deferredRequest());
        const { result } = renderHook(() => useHeaderSearch(), { wrapper });
        await type(result, "ab");
        await flushDebounce();
        expect(first.abort).not.toHaveBeenCalled();

        await type(result, "abc");
        await flushDebounce();

        expect(first.abort).toHaveBeenCalledTimes(1);
    });

    it("aborts the in-flight request on Esc, on a too-short query and on blur", async () => {
        const requests = [deferredRequest(), deferredRequest(), deferredRequest()];
        requests.forEach((request) => mockTrigger.mockReturnValueOnce(request));
        const { result } = renderHook(() => useHeaderSearch(), { wrapper });

        await type(result, "ab");
        await flushDebounce();
        act(() => result.current.clear());
        expect(requests[0].abort).toHaveBeenCalledTimes(1);

        await type(result, "cd");
        await flushDebounce();
        await type(result, "c");
        expect(requests[1].abort).toHaveBeenCalledTimes(1);

        await type(result, "ef");
        await flushDebounce();
        act(() => result.current.close());
        expect(requests[2].abort).toHaveBeenCalledTimes(1);
    });

    it("aborts the in-flight request and drops the timer when the header unmounts", async () => {
        const request = deferredRequest();
        mockTrigger.mockReturnValue(request);
        const { result, unmount } = renderHook(() => useHeaderSearch(), { wrapper });
        await type(result, "ab");
        await flushDebounce();

        unmount();

        expect(request.abort).toHaveBeenCalledTimes(1);
    });

    it("does not fire a pending debounce after unmount", async () => {
        mockTrigger.mockReturnValue(deferredRequest());
        const { result, unmount } = renderHook(() => useHeaderSearch(), { wrapper });
        await type(result, "ab");

        unmount();
        await flushDebounce();

        expect(mockTrigger).not.toHaveBeenCalled();
    });

    it("ignores an older response that settles after a newer search, even if abort does nothing", async () => {
        const older = deferredRequest();
        const newer = deferredRequest();
        mockTrigger.mockReturnValueOnce(older).mockReturnValueOnce(newer);
        const { result } = renderHook(() => useHeaderSearch(), { wrapper });
        await type(result, "ab");
        await flushDebounce();
        await type(result, "abc");
        await flushDebounce();

        await settle(newer, { data: [{ id: 2 }], count: 1 });
        await settle(older, { data: [{ id: 1 }], count: 1 });

        expect(result.current.results).toEqual([{ id: 2 }]);
    });

    it("ignores a response that settles after the search was cancelled and another one started", async () => {
        const cancelled = deferredRequest();
        const current = deferredRequest();
        mockTrigger.mockReturnValueOnce(cancelled).mockReturnValueOnce(current);
        const { result } = renderHook(() => useHeaderSearch(), { wrapper });
        await type(result, "ab");
        await flushDebounce();
        act(() => result.current.clear());
        await type(result, "cd");
        await flushDebounce();

        await settle(cancelled, { data: [{ id: 1 }], count: 1 });

        expect(result.current.results).toEqual([]);
        expect(result.current.status).toBe(SEARCH_STATUS.LOADING);
    });

    it("ignores a response that settles after the search was cancelled", async () => {
        const request = deferredRequest();
        mockTrigger.mockReturnValue(request);
        const { result } = renderHook(() => useHeaderSearch(), { wrapper });
        await type(result, "ab");
        await flushDebounce();
        act(() => result.current.clear());

        await settle(request, { data: [{ id: 1 }], count: 1 });

        expect(result.current.results).toEqual([]);
        expect(result.current.status).toBe(SEARCH_STATUS.IDLE);
    });

    it("treats an abort of the current request as a cancellation, not an error", async () => {
        const request = deferredRequest();
        mockTrigger.mockReturnValue(request);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = renderHook(() => useHeaderSearch(), { wrapper });
        await type(result, "ab");
        await flushDebounce();

        await settle(request, Object.assign(new Error("aborted"), { name: "AbortError" }));

        expect(result.current.status).toBe(SEARCH_STATUS.LOADING);
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it("ignores a failure from a search that is no longer current", async () => {
        const older = deferredRequest();
        mockTrigger.mockReturnValueOnce(older).mockReturnValueOnce(deferredRequest());
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = renderHook(() => useHeaderSearch(), { wrapper });
        await type(result, "ab");
        await flushDebounce();
        await type(result, "abc");
        await flushDebounce();

        await settle(older, new Error("boom"));

        expect(result.current.status).toBe(SEARCH_STATUS.LOADING);
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it("tolerates a response with no rows and no total", async () => {
        const request = deferredRequest();
        mockTrigger.mockReturnValue(request);
        const { result } = renderHook(() => useHeaderSearch(), { wrapper });
        await type(result, "ab");
        await flushDebounce();

        await settle(request, {});

        expect(result.current.status).toBe(SEARCH_STATUS.EMPTY);
        expect(result.current.count).toBe(0);
    });
});
