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
// - useBlocker hook to detect navigation attempts (lines 165-168)
// - Separate showBlockerModal state to avoid race conditions (line 80)
// - useCallback for saveAgreement to prevent stale closures (lines 232-310)
// - Ref pattern (saveAgreementRef) to ensure latest save function is called (lines 311-316)
// - useEffect to configure modal when blocker.state === "blocked" (lines 320-355)
//
// Key fix: saveAgreement is called with redirectUrl=null to prevent race condition with Alert
// component navigation. blocker.proceed() handles navigation instead of Alert.
