import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import useBlockerWithBypassRef from "./useBlockerWithBypassRef.hooks";

let blockerCallback;
const mockReset = vi.fn();
const mockProceed = vi.fn();
let blockerState = "unblocked";

vi.mock("react-router-dom", () => ({
    useBlocker: (cb) => {
        blockerCallback = cb;
        return { state: blockerState, reset: mockReset, proceed: mockProceed };
    }
}));

describe("useBlockerWithBypassRef", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        blockerState = "unblocked";
    });

    it("blocks navigation when hasChanged is true and pathname differs", () => {
        renderHook(() => useBlockerWithBypassRef(true));

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/agreements/create" },
            nextLocation: { pathname: "/agreements" }
        });

        expect(shouldBlock).toBe(true);
    });

    it("does not block navigation when hasChanged is false", () => {
        renderHook(() => useBlockerWithBypassRef(false));

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/agreements/create" },
            nextLocation: { pathname: "/agreements" }
        });

        expect(shouldBlock).toBe(false);
    });

    it("does not block same-path navigation", () => {
        renderHook(() => useBlockerWithBypassRef(true));

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/agreements/create" },
            nextLocation: { pathname: "/agreements/create" }
        });

        expect(shouldBlock).toBe(false);
    });

    it("does not block navigation when isBypassingRef.current is true, even if hasChanged is true", () => {
        const { result } = renderHook(() => useBlockerWithBypassRef(true));
        result.current.isBypassingRef.current = true;

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/agreements/create" },
            nextLocation: { pathname: "/agreements" }
        });

        expect(shouldBlock).toBe(false);
    });

    it("keeps blockerRef.current in sync with the latest blocker on re-render", () => {
        blockerState = "unblocked";
        const { result, rerender } = renderHook(() => useBlockerWithBypassRef(true));

        expect(result.current.blockerRef.current.state).toBe("unblocked");

        blockerState = "blocked";
        rerender();

        expect(result.current.blocker.state).toBe("blocked");
        expect(result.current.blockerRef.current.state).toBe("blocked");
    });
});
