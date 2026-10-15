import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useUnsavedChangesBlocker from "./useUnsavedChangesBlocker.hooks";
import { proceedIfBlocked } from "./proceedIfBlocked";

vi.mock("./proceedIfBlocked", () => ({
    proceedIfBlocked: vi.fn().mockResolvedValue(undefined)
}));

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

const defaultProps = {
    hasChanged: true,
    heading: "Save changes before leaving?",
    description:
        "You have unsaved changes in the procurement tracker. If you leave without completing the current step, these changes will be lost.",
    actionButtonText: "Go back",
    secondaryButtonText: "Leave without saving"
};

describe("useUnsavedChangesBlocker", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        blockerState = "unblocked";
    });

    it("returns initial state with modal hidden", () => {
        const { result } = renderHook(() => useUnsavedChangesBlocker(defaultProps));

        expect(result.current.showBlockerModal).toBe(false);
        expect(result.current.blockerModalProps).toEqual({});
    });

    it("blocks navigation when hasChanged is true and pathname differs", () => {
        renderHook(() => useUnsavedChangesBlocker(defaultProps));

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/agreements/1/procurement-tracker" },
            nextLocation: { pathname: "/agreements/1/budget-lines" }
        });

        expect(shouldBlock).toBe(true);
    });

    it("does not block navigation when hasChanged is false", () => {
        renderHook(() => useUnsavedChangesBlocker({ ...defaultProps, hasChanged: false }));

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/agreements/1/procurement-tracker" },
            nextLocation: { pathname: "/agreements/1/budget-lines" }
        });

        expect(shouldBlock).toBe(false);
    });

    it("does not block same-path navigation", () => {
        renderHook(() => useUnsavedChangesBlocker(defaultProps));

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/agreements/1/procurement-tracker" },
            nextLocation: { pathname: "/agreements/1/procurement-tracker" }
        });

        expect(shouldBlock).toBe(false);
    });

    it("shows modal with correct props when blocked", () => {
        blockerState = "blocked";

        const { result } = renderHook(() => useUnsavedChangesBlocker(defaultProps));

        expect(result.current.showBlockerModal).toBe(true);
        expect(result.current.blockerModalProps.heading).toBe("Save changes before leaving?");
        expect(result.current.blockerModalProps.description).toBe(
            "You have unsaved changes in the procurement tracker. If you leave without completing the current step, these changes will be lost."
        );
        expect(result.current.blockerModalProps.actionButtonText).toBe("Go back");
        expect(result.current.blockerModalProps.secondaryButtonText).toBe("Leave without saving");
    });

    it("closes modal and resets blocker on Go back (handleConfirm)", () => {
        blockerState = "blocked";

        const { result } = renderHook(() => useUnsavedChangesBlocker(defaultProps));

        act(() => {
            result.current.blockerModalProps.handleConfirm();
        });

        expect(result.current.showBlockerModal).toBe(false);
        expect(mockReset).toHaveBeenCalled();
        expect(mockProceed).not.toHaveBeenCalled();
    });

    it("closes modal and proceeds on Leave without saving (handleSecondary)", async () => {
        blockerState = "blocked";

        const { result } = renderHook(() => useUnsavedChangesBlocker(defaultProps));

        await act(async () => {
            await result.current.blockerModalProps.handleSecondary();
        });

        expect(result.current.showBlockerModal).toBe(false);
        // proceedIfBlocked is the shared helper — verify it was called with the blocker
        expect(proceedIfBlocked).toHaveBeenCalled();
        expect(mockReset).not.toHaveBeenCalled();
    });

    it("closes modal and resets blocker on Escape (closeModal)", () => {
        blockerState = "blocked";

        const { result } = renderHook(() => useUnsavedChangesBlocker(defaultProps));

        act(() => {
            result.current.blockerModalProps.closeModal();
        });

        expect(result.current.showBlockerModal).toBe(false);
        expect(mockReset).toHaveBeenCalled();
    });

    it("handles errors from proceedIfBlocked gracefully on Leave", async () => {
        blockerState = "blocked";
        // Simulate proceedIfBlocked throwing (the helper handles RR-specific suppression internally)
        proceedIfBlocked.mockRejectedValueOnce(new Error("unexpected error"));

        const { result } = renderHook(() => useUnsavedChangesBlocker(defaultProps));

        // Should propagate — this test verifies we don't swallow unknown errors in handleSecondary
        await expect(
            act(async () => {
                await result.current.blockerModalProps.handleSecondary();
            })
        ).rejects.toThrow("unexpected error");
    });
});
