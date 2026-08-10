import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useNavigationBlocker from "./useNavigationBlocker.hooks";

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

describe("useNavigationBlocker", () => {
    const defaultProps = {
        hasChanged: true,
        saveChanges: vi.fn().mockResolvedValue(undefined),
        onExit: vi.fn(),
        onSaveError: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        blockerState = "unblocked";
    });

    it("returns initial state with modal hidden", () => {
        const { result } = renderHook(() => useNavigationBlocker(defaultProps));

        expect(result.current.showBlockerModal).toBe(false);
        expect(result.current.blockerModalProps).toEqual({});
    });

    it("blocks navigation when hasChanged is true and not cancelling", () => {
        renderHook(() => useNavigationBlocker(defaultProps));

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/cans/1" },
            nextLocation: { pathname: "/cans/1/funding" }
        });

        expect(shouldBlock).toBe(true);
    });

    it("does not block navigation when hasChanged is false", () => {
        renderHook(() => useNavigationBlocker({ ...defaultProps, hasChanged: false }));

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/cans/1" },
            nextLocation: { pathname: "/cans/1/funding" }
        });

        expect(shouldBlock).toBe(false);
    });

    it("does not block navigation when isCancelling is true", () => {
        const { result } = renderHook(() => useNavigationBlocker(defaultProps));

        act(() => {
            result.current.setIsCancelling(true);
        });

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/cans/1" },
            nextLocation: { pathname: "/cans/1/funding" }
        });

        expect(shouldBlock).toBe(false);
    });

    it("does not block same-path navigation", () => {
        renderHook(() => useNavigationBlocker(defaultProps));

        const shouldBlock = blockerCallback({
            currentLocation: { pathname: "/cans/1" },
            nextLocation: { pathname: "/cans/1" }
        });

        expect(shouldBlock).toBe(false);
    });

    it("shows modal with correct props when blocked", () => {
        blockerState = "blocked";

        const { result } = renderHook(() => useNavigationBlocker(defaultProps));

        expect(result.current.showBlockerModal).toBe(true);
        expect(result.current.blockerModalProps.heading).toBe("You have unsaved changes");
        expect(result.current.blockerModalProps.actionButtonText).toBe("Save Changes");
        expect(result.current.blockerModalProps.secondaryButtonText).toBe("Leave without saving");
    });

    it("saves and proceeds on confirm", async () => {
        blockerState = "blocked";
        mockProceed.mockResolvedValue(undefined);

        const { result } = renderHook(() => useNavigationBlocker(defaultProps));

        await act(async () => {
            await result.current.blockerModalProps.handleConfirm();
        });

        expect(defaultProps.saveChanges).toHaveBeenCalled();
        expect(defaultProps.onExit).toHaveBeenCalled();
        expect(result.current.showBlockerModal).toBe(false);
    });

    it("calls onSaveError and resets blocker when save fails", async () => {
        blockerState = "blocked";
        const error = new Error("save failed");
        const failingSave = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(() => useNavigationBlocker({ ...defaultProps, saveChanges: failingSave }));

        await act(async () => {
            await result.current.blockerModalProps.handleConfirm();
        });

        expect(defaultProps.onSaveError).toHaveBeenCalledWith(error);
        expect(mockReset).toHaveBeenCalled();
        expect(defaultProps.onExit).not.toHaveBeenCalled();
    });

    it("exits without saving on secondary action", async () => {
        blockerState = "blocked";
        mockProceed.mockResolvedValue(undefined);

        const { result } = renderHook(() => useNavigationBlocker(defaultProps));

        await act(async () => {
            await result.current.blockerModalProps.handleSecondary();
        });

        expect(defaultProps.saveChanges).not.toHaveBeenCalled();
        expect(defaultProps.onExit).toHaveBeenCalled();
        expect(result.current.showBlockerModal).toBe(false);
    });

    it("resets blocker and hides modal on closeModal", () => {
        blockerState = "blocked";

        const { result } = renderHook(() => useNavigationBlocker(defaultProps));

        act(() => {
            result.current.blockerModalProps.closeModal();
        });

        expect(result.current.showBlockerModal).toBe(false);
        expect(mockReset).toHaveBeenCalled();
    });

    it("handles known React Router blocker state transition error gracefully", async () => {
        blockerState = "blocked";
        mockProceed.mockRejectedValue(new Error("Invalid blocker state transition from proceeding"));

        const { result } = renderHook(() => useNavigationBlocker(defaultProps));

        await act(async () => {
            await result.current.blockerModalProps.handleSecondary();
        });

        expect(defaultProps.onExit).toHaveBeenCalled();
    });
});
