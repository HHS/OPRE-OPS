import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { useNavigationBlockerContext, useNavigationBlocker } from "./useNavigationBlocker";
import { NavigationBlockerProvider } from "../contexts/NavigationBlockerContext";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
    useBlocker: vi.fn(() => ({
        state: "unblocked",
        proceed: vi.fn(),
        reset: vi.fn()
    }))
}));

// Mock SaveChangesAndExitModal
vi.mock("../components/UI/Modals/SaveChangesAndExitModal", () => ({
    default: () => <div data-testid="modal" />
}));

describe("useNavigationBlockerContext", () => {
    it("throws error when used outside NavigationBlockerProvider", () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() => {
            renderHook(() => useNavigationBlockerContext());
        }).toThrow("useNavigationBlockerContext must be used within a NavigationBlockerProvider");

        consoleSpy.mockRestore();
    });

    it("returns context when used within NavigationBlockerProvider", () => {
        const wrapper = ({ children }) => (
            <NavigationBlockerProvider>{children}</NavigationBlockerProvider>
        );

        const { result } = renderHook(() => useNavigationBlockerContext(), { wrapper });

        expect(result.current).toHaveProperty("registerBlocker");
        expect(result.current).toHaveProperty("updateBlocker");
        expect(result.current).toHaveProperty("blockerState");
        expect(result.current).toHaveProperty("isBlocked");
    });
});

describe("useNavigationBlocker", () => {
    const wrapper = ({ children }) => (
        <NavigationBlockerProvider>{children}</NavigationBlockerProvider>
    );

    const mockConfig = {
        id: "test-blocker",
        shouldBlock: true,
        modalProps: {
            heading: "Test Heading",
            description: "Test Description",
            actionButtonText: "Save & Exit",
            handleConfirm: vi.fn()
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("registers blocker on mount", () => {
        const { result } = renderHook(() => useNavigationBlocker(mockConfig), { wrapper });

        expect(result.current).toHaveProperty("blockerState");
        expect(result.current).toHaveProperty("isBlocked");
        expect(result.current).toHaveProperty("unregister");
    });

    it("unregisters blocker on unmount", () => {
        const { unmount } = renderHook(() => useNavigationBlocker(mockConfig), { wrapper });

        // Should not throw when unmounting
        expect(() => unmount()).not.toThrow();
    });

    it("re-registers when config id changes", () => {
        const { rerender } = renderHook(
            ({ config }) => useNavigationBlocker(config),
            {
                wrapper,
                initialProps: { config: mockConfig }
            }
        );

        // Change the id
        const newConfig = { ...mockConfig, id: "new-test-blocker" };
        rerender({ config: newConfig });

        // Should not throw errors during re-registration
        expect(() => rerender({ config: newConfig })).not.toThrow();
    });

    it("updates blocker when shouldBlock changes", () => {
        const { rerender } = renderHook(
            ({ config }) => useNavigationBlocker(config),
            {
                wrapper,
                initialProps: { config: mockConfig }
            }
        );

        // Change shouldBlock
        const updatedConfig = { ...mockConfig, shouldBlock: false };
        rerender({ config: updatedConfig });

        // Should not throw errors during update
        expect(() => rerender({ config: updatedConfig })).not.toThrow();
    });

    it("updates blocker when modalProps change", () => {
        const { rerender } = renderHook(
            ({ config }) => useNavigationBlocker(config),
            {
                wrapper,
                initialProps: { config: mockConfig }
            }
        );

        // Change modalProps
        const updatedConfig = {
            ...mockConfig,
            modalProps: {
                ...mockConfig.modalProps,
                heading: "Updated Heading"
            }
        };
        rerender({ config: updatedConfig });

        // Should not throw errors during update
        expect(() => rerender({ config: updatedConfig })).not.toThrow();
    });

    it("handles config without id gracefully", () => {
        const configWithoutId = {
            shouldBlock: true,
            modalProps: { heading: "Test" }
        };

        const { result } = renderHook(() => useNavigationBlocker(configWithoutId), { wrapper });

        expect(result.current).toHaveProperty("blockerState");
        expect(result.current).toHaveProperty("isBlocked");
        expect(result.current).toHaveProperty("unregister");
    });

    it("handles null/undefined config gracefully", () => {
        const { result } = renderHook(() => useNavigationBlocker(null), { wrapper });

        expect(result.current).toHaveProperty("blockerState");
        expect(result.current).toHaveProperty("isBlocked");
        expect(result.current).toHaveProperty("unregister");
    });

    it("manual unregister works correctly", () => {
        const { result } = renderHook(() => useNavigationBlocker(mockConfig), { wrapper });

        act(() => {
            result.current.unregister();
        });

        // Should be able to call unregister multiple times without error
        act(() => {
            result.current.unregister();
        });

        expect(() => result.current.unregister()).not.toThrow();
    });

    it("returns correct blocker state", () => {
        const { result } = renderHook(() => useNavigationBlocker(mockConfig), { wrapper });

        expect(result.current.blockerState).toBe("unblocked");
        expect(result.current.isBlocked).toBe(false);
    });

    it("handles config changes that don't affect registration", () => {
        const { rerender } = renderHook(
            ({ extraProp }) => useNavigationBlocker({ ...mockConfig, extraProp }),
            {
                wrapper,
                initialProps: { extraProp: "initial" }
            }
        );

        // Change a prop that shouldn't trigger re-registration
        rerender({ extraProp: "changed" });

        // Should not cause issues
        expect(() => rerender({ extraProp: "changed" })).not.toThrow();
    });
});
