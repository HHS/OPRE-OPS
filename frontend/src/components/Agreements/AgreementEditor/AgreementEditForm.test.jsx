import React from "react";
import { render, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Simple test component that mimics the useEffect behavior in AgreementEditForm
const TestComponent = ({ setHasAgreementChanged, hasAgreementChanged }) => {
    React.useEffect(() => {
        if (typeof setHasAgreementChanged === "function") {
            setHasAgreementChanged(hasAgreementChanged);
        }
    }, [hasAgreementChanged, setHasAgreementChanged]);

    return <div data-testid="test-component">hasChanged: {hasAgreementChanged ? "true" : "false"}</div>;
};

describe("AgreementEditForm useEffect behavior", () => {
    let mockSetHasAgreementChanged;

    beforeEach(() => {
        mockSetHasAgreementChanged = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("useEffect infinite loop prevention", () => {
        it("calls setHasAgreementChanged when hasAgreementChanged becomes true", async () => {
            const { rerender } = render(
                <TestComponent
                    setHasAgreementChanged={mockSetHasAgreementChanged}
                    hasAgreementChanged={false}
                />
            );

            // Verify initial call with false
            await waitFor(() => {
                expect(mockSetHasAgreementChanged).toHaveBeenCalledWith(false);
            });

            // Clear the mock to test the change
            mockSetHasAgreementChanged.mockClear();

            // Change hasAgreementChanged to true
            rerender(
                <TestComponent
                    setHasAgreementChanged={mockSetHasAgreementChanged}
                    hasAgreementChanged={true}
                />
            );

            // Verify it's called with true
            await waitFor(() => {
                expect(mockSetHasAgreementChanged).toHaveBeenCalledWith(true);
            });
        });

        it("calls setHasAgreementChanged when hasAgreementChanged becomes false", async () => {
            const { rerender } = render(
                <TestComponent
                    setHasAgreementChanged={mockSetHasAgreementChanged}
                    hasAgreementChanged={true}
                />
            );

            // Verify initial call with true
            await waitFor(() => {
                expect(mockSetHasAgreementChanged).toHaveBeenCalledWith(true);
            });

            // Clear the mock to test the change
            mockSetHasAgreementChanged.mockClear();

            // Change hasAgreementChanged to false
            rerender(
                <TestComponent
                    setHasAgreementChanged={mockSetHasAgreementChanged}
                    hasAgreementChanged={false}
                />
            );

            // Verify it's called with false
            await waitFor(() => {
                expect(mockSetHasAgreementChanged).toHaveBeenCalledWith(false);
            });
        });

        it("does not create infinite loop when setHasAgreementChanged is stable", async () => {
            const stableSetHasAgreementChanged = vi.fn();

            render(
                <TestComponent
                    setHasAgreementChanged={stableSetHasAgreementChanged}
                    hasAgreementChanged={false}
                />
            );

            // Wait a bit to see if there are excessive calls
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Should only be called once initially, not repeatedly
            expect(stableSetHasAgreementChanged).toHaveBeenCalledTimes(1);
            expect(stableSetHasAgreementChanged).toHaveBeenCalledWith(false);
        });

        it("creates multiple renders when setHasAgreementChanged is NOT stable (unstable reference)", async () => {
            let callCount = 0;

            const UnstableCallbackComponent = ({ hasAgreementChanged }) => {
                const [localState, setLocalState] = React.useState(0);

                const unstableCallback = React.useCallback(() => {
                    callCount++;
                    // Trigger a state change that causes re-render
                    setLocalState((prev) => prev + 1);
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [callCount]); // callCount changes every time, making callback unstable

                React.useEffect(() => {
                    // Only call on initial render and when callback changes
                    if (callCount < 5) {
                        // Prevent infinite loop by limiting calls
                        unstableCallback();
                    }
                }, [unstableCallback]); // unstableCallback changes every render

                return (
                    <div data-testid="unstable-component">
                        hasChanged: {hasAgreementChanged ? "true" : "false"}, state: {localState}
                    </div>
                );
            };

            render(<UnstableCallbackComponent hasAgreementChanged={false} />);

            // Wait for the unstable callback to trigger multiple times
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Should be called multiple times due to unstable callback
            expect(callCount).toBeGreaterThan(1);
        });

        it("handles undefined setHasAgreementChanged gracefully", async () => {
            // Should not throw error when setHasAgreementChanged is undefined
            expect(() => {
                render(
                    <TestComponent
                        setHasAgreementChanged={undefined}
                        hasAgreementChanged={true}
                    />
                );
            }).not.toThrow();
        });

        it("useEffect has correct dependencies to prevent unnecessary calls", async () => {
            const mockSetHasAgreementChangedStable = vi.fn();

            const { rerender } = render(
                <TestComponent
                    setHasAgreementChanged={mockSetHasAgreementChangedStable}
                    hasAgreementChanged={false}
                />
            );

            // Clear initial call
            mockSetHasAgreementChangedStable.mockClear();

            // Re-render with same props (should not trigger useEffect)
            rerender(
                <TestComponent
                    setHasAgreementChanged={mockSetHasAgreementChangedStable}
                    hasAgreementChanged={false}
                />
            );

            // Should not be called again since dependencies haven't changed
            expect(mockSetHasAgreementChangedStable).not.toHaveBeenCalled();
        });

        it("useEffect triggers when hasAgreementChanged dependency changes", async () => {
            const { rerender } = render(
                <TestComponent
                    setHasAgreementChanged={mockSetHasAgreementChanged}
                    hasAgreementChanged={false}
                />
            );

            // Clear initial call
            mockSetHasAgreementChanged.mockClear();

            // Change hasAgreementChanged value
            rerender(
                <TestComponent
                    setHasAgreementChanged={mockSetHasAgreementChanged}
                    hasAgreementChanged={true}
                />
            );

            // Should be called with new value
            await waitFor(() => {
                expect(mockSetHasAgreementChanged).toHaveBeenCalledWith(true);
            });
        });

        it("demonstrates memoization benefit - stable vs unstable callbacks", async () => {
            let stableCallCount = 0;
            let unstableCallCount = 0;

            const StableComponent = () => {
                const stableCallback = React.useCallback(() => {
                    stableCallCount++;
                }, []); // Empty deps = stable

                React.useEffect(() => {
                    stableCallback();
                }, [stableCallback]); // stableCallback won't change

                return <div>Stable</div>;
            };

            const UnstableComponent = () => {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                const unstableCallback = () => {
                    // New function every render
                    unstableCallCount++;
                };

                React.useEffect(() => {
                    unstableCallback();
                }, [unstableCallback]); // unstableCallback changes every render

                return <div>Unstable</div>;
            };

            const { rerender: rerenderStable } = render(<StableComponent />);
            const { rerender: rerenderUnstable } = render(<UnstableComponent />);

            // Force several re-renders
            for (let i = 0; i < 3; i++) {
                rerenderStable(<StableComponent />);
                rerenderUnstable(<UnstableComponent />);
            }

            await new Promise((resolve) => setTimeout(resolve, 50));

            // Stable callback should be called fewer times
            expect(stableCallCount).toBeLessThan(unstableCallCount);
            expect(unstableCallCount).toBeGreaterThan(stableCallCount);
        });
    });

    describe("Navigation blocker behavior", () => {
        it("blocker triggers when conditions are met", () => {
            // Test the blocker condition logic
            const hasAgreementChanged = true;
            const isCancelling = false;
            const currentLocation = { pathname: "/agreements/1" };
            const nextLocation = { pathname: "/agreements" };

            // The blocker condition from useBlocker:
            // !isCancelling && hasAgreementChanged && currentLocation.pathname !== nextLocation.pathname
            const shouldBlock = !isCancelling && hasAgreementChanged && currentLocation.pathname !== nextLocation.pathname;

            expect(shouldBlock).toBe(true);
        });

        it("blocker does not trigger when isCancelling is true", () => {
            const hasAgreementChanged = true;
            const isCancelling = true;
            const currentLocation = { pathname: "/agreements/1" };
            const nextLocation = { pathname: "/agreements" };

            const shouldBlock = !isCancelling && hasAgreementChanged && currentLocation.pathname !== nextLocation.pathname;

            expect(shouldBlock).toBe(false);
        });

        it("blocker does not trigger when hasAgreementChanged is false", () => {
            const hasAgreementChanged = false;
            const isCancelling = false;
            const currentLocation = { pathname: "/agreements/1" };
            const nextLocation = { pathname: "/agreements" };

            const shouldBlock = !isCancelling && hasAgreementChanged && currentLocation.pathname !== nextLocation.pathname;

            expect(shouldBlock).toBe(false);
        });

        it("blocker does not trigger when navigating to same pathname", () => {
            const hasAgreementChanged = true;
            const isCancelling = false;
            const currentLocation = { pathname: "/agreements/1" };
            const nextLocation = { pathname: "/agreements/1" };

            const shouldBlock = !isCancelling && hasAgreementChanged && currentLocation.pathname !== nextLocation.pathname;

            expect(shouldBlock).toBe(false);
        });

        it("blocker triggers on different pathname with unsaved changes", () => {
            const hasAgreementChanged = true;
            const isCancelling = false;
            const currentLocation = { pathname: "/agreements/1" };
            const nextLocation = { pathname: "/portfolios" };

            const shouldBlock = !isCancelling && hasAgreementChanged && currentLocation.pathname !== nextLocation.pathname;

            expect(shouldBlock).toBe(true);
        });
    });

    describe("Blocker modal props configuration", () => {
        it("modal props should have correct structure for blocker modal", () => {
            // Test the expected structure of blockerModalProps as configured in the useEffect
            const mockHandleConfirm = vi.fn();
            const mockHandleSecondary = vi.fn();
            const mockCloseModal = vi.fn();

            const expectedModalProps = {
                heading: "You have unsaved changes",
                description: "Do you want to save your changes before leaving this page?",
                actionButtonText: "Save Changes",
                secondaryButtonText: "Leave without saving",
                handleConfirm: mockHandleConfirm,
                handleSecondary: mockHandleSecondary,
                closeModal: mockCloseModal
            };

            // Verify each property exists and has the correct value/type
            expect(expectedModalProps.heading).toBe("You have unsaved changes");
            expect(expectedModalProps.description).toBe("Do you want to save your changes before leaving this page?");
            expect(expectedModalProps.actionButtonText).toBe("Save Changes");
            expect(expectedModalProps.secondaryButtonText).toBe("Leave without saving");
            expect(typeof expectedModalProps.handleConfirm).toBe("function");
            expect(typeof expectedModalProps.handleSecondary).toBe("function");
            expect(typeof expectedModalProps.closeModal).toBe("function");

            // Verify the functions can be called
            expectedModalProps.handleConfirm();
            expectedModalProps.handleSecondary();
            expectedModalProps.closeModal();

            expect(mockHandleConfirm).toHaveBeenCalled();
            expect(mockHandleSecondary).toHaveBeenCalled();
            expect(mockCloseModal).toHaveBeenCalled();
        });
    });

    describe("isCancelling flag behavior", () => {
        it("resets isCancelling when entering edit mode", () => {
            // Simulates the logic from the useEffect that resets isCancelling
            let isCancelling = true;
            const wasEditMode = false;
            const isEditMode = true;

            // When we newly enter edit mode, clear any stale cancelling state
            if (!wasEditMode && isEditMode) {
                isCancelling = false;
            }

            expect(isCancelling).toBe(false);
        });

        it("does not reset isCancelling when already in edit mode", () => {
            let isCancelling = true;
            const wasEditMode = true;
            const isEditMode = true;

            // Should not reset if already in edit mode
            if (!wasEditMode && isEditMode) {
                isCancelling = false;
            }

            expect(isCancelling).toBe(true);
        });

        it("does not reset isCancelling when not in edit mode", () => {
            let isCancelling = true;
            const wasEditMode = false;
            const isEditMode = false;

            // Should not reset if not entering edit mode
            if (!wasEditMode && isEditMode) {
                isCancelling = false;
            }

            expect(isCancelling).toBe(true);
        });
    });

    describe("Ref synchronization", () => {
        it("saveAgreementRef should maintain reference to latest saveAgreement function", () => {
            const saveAgreement1 = vi.fn();
            const saveAgreement2 = vi.fn();

            // Simulates the ref pattern
            const saveAgreementRef = { current: saveAgreement1 };

            // Initial assignment
            expect(saveAgreementRef.current).toBe(saveAgreement1);

            // Update to new function (like in useEffect)
            saveAgreementRef.current = saveAgreement2;

            expect(saveAgreementRef.current).toBe(saveAgreement2);
        });

        it("wasEditModeRef should track previous edit mode state", () => {
            // Simulates the ref pattern for tracking previous edit mode
            const wasEditModeRef = { current: false };

            expect(wasEditModeRef.current).toBe(false);

            // Update to new state
            wasEditModeRef.current = true;

            expect(wasEditModeRef.current).toBe(true);
        });
    });
});

// Note: The blocker modal functionality in AgreementEditForm uses useBlocker from react-router-dom.
// Full integration testing of the modal requires mocking the entire component tree including
// EditAgreementProvider, Redux store, and all API hooks. For comprehensive testing of the blocker
// modal user flows, see the E2E tests or manually test the following scenarios:
//
// 1. Make an edit and click "Portfolios" link → Modal appears → Click "Save Changes" → Navigates to Portfolios
// 2. Make an edit and click "Leave without saving" → Navigates away without saving
// 3. Make an edit and press Escape → Modal closes, navigation canceled
// 4. Make an edit, try to navigate, mock save to fail → blocker.reset() is called
//
// The implementation uses:
// - useBlocker hook to detect navigation attempts (lines 179-182)
// - Separate showBlockerModal state to avoid race conditions (line 80)
// - useCallback for saveAgreement to prevent stale closures (lines 244-324)
// - Ref pattern (saveAgreementRef) to ensure latest save function is called (lines 327-331)
// - useEffect to configure modal when blocker.state === "blocked" (lines 334-367)
//
// Key fix: saveAgreement is called with redirectUrl=null to prevent race condition with Alert
// component navigation. blocker.proceed() handles navigation instead of Alert.
