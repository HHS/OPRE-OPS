import { renderHook } from "@testing-library/react";
import useHasStateChanged from "./useHasStateChanged.hooks";

describe("useHasStateChanged", () => {
    it("returns false when initial state has not changed", () => {
        const initialState = { key: "value" };
        const { result } = renderHook(() => useHasStateChanged(initialState));

        expect(result.current).toBe(false);
    });

    it("returns true when initial state has changed", () => {
        const initialState = { key: "value" };
        const { result, rerender } = renderHook((initialState) => useHasStateChanged(initialState), {
            initialProps: initialState
        });

        initialState.key = "new value";
        rerender(initialState);

        expect(result.current).toBe(true);
    });
});
