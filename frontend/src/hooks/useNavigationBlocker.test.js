import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import useSimpleNavigationBlocker from "./useSimpleNavigationBlocker";

// Use vi.hoisted to create variables that can be used in the mock
const { mockBlocker, mockUseBlocker } = vi.hoisted(() => {
    const mockBlocker = {
        state: "unblocked",
        proceed: vi.fn(),
        reset: vi.fn(function() {
            this.state = "unblocked";
        })
    };
    const mockUseBlocker = vi.fn(() => mockBlocker);
    return { mockBlocker, mockUseBlocker };
});

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
    useBlocker: mockUseBlocker
}));

describe("useSimpleNavigationBlocker", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBlocker.state = "unblocked";
        mockBlocker.proceed.mockClear();
        mockBlocker.reset.mockClear();
        mockUseBlocker.mockClear();
        mockUseBlocker.mockReturnValue(mockBlocker);
    });

    const mockModalProps = {
        heading: "Test Heading",
        description: "Test Description",
        actionButtonText: "Save & Exit",
        secondaryButtonText: "Exit Without Saving",
        handleConfirm: vi.fn(),
        handleSecondary: vi.fn()
    };

    it("returns initial state correctly", () => {
        const { result } = renderHook(() =>
            useSimpleNavigationBlocker({
                shouldBlock: false,
                modalProps: mockModalProps
            })
        );

        expect(result.current).toHaveProperty("showModal", false);
        expect(result.current).toHaveProperty("modalProps", null);
        expect(result.current).toHaveProperty("setShowModal");
        expect(typeof result.current.setShowModal).toBe("function");
    });

    it("calls useBlocker with correct blocking function", () => {
        renderHook(() =>
            useSimpleNavigationBlocker({
                shouldBlock: true,
                modalProps: mockModalProps
            })
        );

        expect(mockUseBlocker).toHaveBeenCalledTimes(1);
        expect(typeof mockUseBlocker.mock.calls[0][0]).toBe("function");
    });

    it("should not block navigation to same path", () => {
        let blockingFunction;
        mockUseBlocker.mockImplementation((fn) => {
            blockingFunction = fn;
            return mockBlocker;
        });

        renderHook(() =>
            useSimpleNavigationBlocker({
                shouldBlock: true,
                modalProps: mockModalProps
            })
        );

        const result = blockingFunction({
            currentLocation: { pathname: "/test" },
            nextLocation: { pathname: "/test" }
        });

        expect(result).toBe(false);
    });

    it("should block navigation when shouldBlock is true and paths differ", () => {
        let blockingFunction;
        mockUseBlocker.mockImplementation((fn) => {
            blockingFunction = fn;
            return mockBlocker;
        });

        renderHook(() =>
            useSimpleNavigationBlocker({
                shouldBlock: true,
                modalProps: mockModalProps
            })
        );

        const result = blockingFunction({
            currentLocation: { pathname: "/test" },
            nextLocation: { pathname: "/other" }
        });

        expect(result).toBe(true);
    });

    it("should not block navigation when shouldBlock is false", () => {
        let blockingFunction;
        mockUseBlocker.mockImplementation((fn) => {
            blockingFunction = fn;
            return mockBlocker;
        });

        renderHook(() =>
            useSimpleNavigationBlocker({
                shouldBlock: false,
                modalProps: mockModalProps
            })
        );

        const result = blockingFunction({
            currentLocation: { pathname: "/test" },
            nextLocation: { pathname: "/other" }
        });

        expect(result).toBe(false);
    });

    it("shows modal when blocker state is blocked", () => {
        const { result, rerender } = renderHook(() =>
            useSimpleNavigationBlocker({
                shouldBlock: true,
                modalProps: mockModalProps
            })
        );

        // Simulate blocker becoming blocked
        mockBlocker.state = "blocked";
        rerender();

        expect(result.current.showModal).toBe(true);
        expect(result.current.modalProps).toMatchObject({
            heading: "Test Heading",
            description: "Test Description",
            actionButtonText: "Save & Exit",
            secondaryButtonText: "Exit Without Saving"
        });
        expect(typeof result.current.modalProps.handleConfirm).toBe("function");
        expect(typeof result.current.modalProps.handleSecondary).toBe("function");
        expect(typeof result.current.modalProps.resetBlocker).toBe("function");
    });

    it("hides modal when blocker state is not blocked", () => {
        const { result, rerender } = renderHook(() =>
            useSimpleNavigationBlocker({
                shouldBlock: true,
                modalProps: mockModalProps
            })
        );

        // Start with blocked state
        mockBlocker.state = "blocked";
        rerender();
        expect(result.current.showModal).toBe(true);

        // Change to unblocked
        mockBlocker.state = "unblocked";
        rerender();
        expect(result.current.showModal).toBe(false);
    });

    it("calls handleConfirm and proceeds when confirm action is triggered", async () => {
        const { result, rerender } = renderHook(() =>
            useSimpleNavigationBlocker({
                shouldBlock: true,
                modalProps: mockModalProps
            })
        );

        // Set up blocked state and trigger re-render
        mockBlocker.state = "blocked";
        rerender();

        const confirmHandler = result.current.modalProps?.handleConfirm;
        expect(confirmHandler).toBeDefined();

        await act(async () => {
            await confirmHandler();
        });

        expect(mockModalProps.handleConfirm).toHaveBeenCalledTimes(1);
        expect(mockBlocker.proceed).toHaveBeenCalledTimes(1);
    });

    it("calls handleSecondary and proceeds when secondary action is triggered", async () => {
        const { result, rerender } = renderHook(() =>
            useSimpleNavigationBlocker({
                shouldBlock: true,
                modalProps: mockModalProps
            })
        );

        // Set up blocked state and trigger re-render
        mockBlocker.state = "blocked";
        rerender();

        const secondaryHandler = result.current.modalProps?.handleSecondary;
        expect(secondaryHandler).toBeDefined();

        await act(async () => {
            await secondaryHandler();
        });

        expect(mockModalProps.handleSecondary).toHaveBeenCalledTimes(1);
        expect(mockBlocker.proceed).toHaveBeenCalledTimes(1);
    });

    it("calls reset and hides modal when resetBlocker is triggered", () => {
        const { result, rerender } = renderHook(() =>
            useSimpleNavigationBlocker({
                shouldBlock: true,
                modalProps: mockModalProps
            })
        );

        // Set up blocked state and trigger re-render
        mockBlocker.state = "blocked";
        rerender();

        const resetHandler = result.current.modalProps?.resetBlocker;
        expect(resetHandler).toBeDefined();

        act(() => {
            resetHandler();
        });

        // After calling reset, the blocker state changes and we need to check the next render
        expect(mockBlocker.reset).toHaveBeenCalledTimes(1);

        // The modal should be hidden after the reset operation completes
        rerender();
        expect(result.current.showModal).toBe(false);
    });
});
