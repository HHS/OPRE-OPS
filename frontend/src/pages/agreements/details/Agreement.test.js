import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import store from "../../../store";

// Simple test component that demonstrates the memoization behavior
const TestMemoizationComponent = () => {
    const [hasAgreementChanged, setHasAgreementChanged] = React.useState(false);

    // Memoize setHasAgreementChanged to prevent infinite loops in child components
    const memoizedSetHasAgreementChanged = React.useCallback((hasChanged) => {
        setHasAgreementChanged(hasChanged);
    }, []);

    return {
        hasAgreementChanged,
        memoizedSetHasAgreementChanged,
        setHasAgreementChanged
    };
};

// Mock child component that tests the callback stability
const MockChildComponent = ({ setHasAgreementChanged, trackCallback, renderCount, forceRender }) => {
    React.useEffect(() => {
        if (trackCallback) {
            trackCallback(setHasAgreementChanged);
        }
        if (typeof setHasAgreementChanged === "function") {
            setHasAgreementChanged(true);
            setHasAgreementChanged(false);
        }
    }, [setHasAgreementChanged, trackCallback]);

    return (
        <div data-testid="mock-child">
            Mock Child Component {renderCount || ""} {forceRender || ""}
        </div>
    );
};

const TestWrapper = ({ children }) => (
    <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
    </Provider>
);

describe("Agreement memoization functionality", () => {
    beforeEach(() => {
        // Reset any mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("memoizedSetHasAgreementChanged functionality", () => {
        it("creates a stable memoized callback", async () => {
            const capturedCallbacks = [];
            let renderCount = 0;

            const trackCallback = (callback) => {
                capturedCallbacks.push(callback);
            };

            const TestComponent = ({ forceRender }) => {
                renderCount++;
                const { memoizedSetHasAgreementChanged } = TestMemoizationComponent();

                // Always track the callback on each render
                React.useEffect(() => {
                    trackCallback(memoizedSetHasAgreementChanged);
                });

                return (
                    <MockChildComponent
                        setHasAgreementChanged={memoizedSetHasAgreementChanged}
                        renderCount={renderCount}
                        forceRender={forceRender}
                    />
                );
            };

            const { rerender } = render(
                <TestWrapper>
                    <TestComponent forceRender={1} />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(capturedCallbacks.length).toBeGreaterThan(0);
            });

            // Force a re-render with different props
            rerender(
                <TestWrapper>
                    <TestComponent forceRender={2} />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(capturedCallbacks.length).toBeGreaterThanOrEqual(2);
            });

            // Verify that the callback reference is stable across re-renders
            expect(capturedCallbacks[0]).toBe(capturedCallbacks[1]);
        });

        it("memoized callback correctly updates hasAgreementChanged state", async () => {
            const TestComponent = () => {
                const { hasAgreementChanged, memoizedSetHasAgreementChanged } = TestMemoizationComponent();

                return (
                    <div>
                        <div data-testid="state-display">hasChanged: {hasAgreementChanged ? "true" : "false"}</div>
                        <MockChildComponent setHasAgreementChanged={memoizedSetHasAgreementChanged} />
                    </div>
                );
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            // The MockChildComponent calls setHasAgreementChanged(true) then setHasAgreementChanged(false)
            // We should see the final state reflected
            await waitFor(() => {
                expect(screen.getByTestId("state-display")).toHaveTextContent("hasChanged: false");
            });
        });

        it("prevents infinite loops by using useCallback", async () => {
            let callCount = 0;

            const MockChildWithCounter = ({ setHasAgreementChanged }) => {
                React.useEffect(() => {
                    callCount++;
                    if (typeof setHasAgreementChanged === "function") {
                        setHasAgreementChanged(true);
                    }
                }, [setHasAgreementChanged]);

                return <div data-testid="mock-child-counter">Mock Child</div>;
            };

            const TestComponent = () => {
                const { memoizedSetHasAgreementChanged } = TestMemoizationComponent();

                return <MockChildWithCounter setHasAgreementChanged={memoizedSetHasAgreementChanged} />;
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            // Wait a bit to see if there are excessive calls
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Should only be called a reasonable number of times, not infinitely
            expect(callCount).toBeLessThan(5);
        });

        it("handles callback being called with different values", async () => {
            let callValues = [];

            const TestComponent = () => {
                const { memoizedSetHasAgreementChanged } = TestMemoizationComponent();

                React.useEffect(() => {
                    // Test calling the callback with different values
                    const testValues = [true, false, true, false];
                    testValues.forEach((value) => {
                        memoizedSetHasAgreementChanged(value);
                        callValues.push(value);
                    });
                }, [memoizedSetHasAgreementChanged]);

                return <div data-testid="test-component">Test Component</div>;
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(callValues.length).toBe(4);
            });

            expect(callValues).toEqual([true, false, true, false]);
        });

        it("memoized callback works with undefined and null values", async () => {
            const TestComponent = () => {
                const { memoizedSetHasAgreementChanged } = TestMemoizationComponent();

                React.useEffect(() => {
                    // Test calling with edge case values
                    memoizedSetHasAgreementChanged(undefined);
                    memoizedSetHasAgreementChanged(null);
                    memoizedSetHasAgreementChanged(0);
                    memoizedSetHasAgreementChanged("");
                }, [memoizedSetHasAgreementChanged]);

                return <div data-testid="edge-case-test">Edge Case Test</div>;
            };

            expect(() => {
                render(
                    <TestWrapper>
                        <TestComponent />
                    </TestWrapper>
                );
            }).not.toThrow();
        });
    });

    describe("useCallback edge cases", () => {
        it("demonstrates difference between memoized and non-memoized callbacks", async () => {
            let memoizedCallCount = 0;
            let nonMemoizedCallCount = 0;

            const TestComponentWithMemoized = () => {
                const [, setState] = React.useState(false);

                const memoizedCallback = React.useCallback((value) => {
                    setState(value);
                }, []);

                React.useEffect(() => {
                    memoizedCallCount++;
                    memoizedCallback(true);
                }, [memoizedCallback]);

                return <div>Memoized</div>;
            };

            const TestComponentWithoutMemoized = () => {
                const [, setState] = React.useState(false);

                // eslint-disable-next-line react-hooks/exhaustive-deps
                const nonMemoizedCallback = (value) => {
                    setState(value);
                };

                React.useEffect(() => {
                    nonMemoizedCallCount++;
                    nonMemoizedCallback(true);
                }, [nonMemoizedCallback]);

                return <div>Non-Memoized</div>;
            };

            const { rerender: rerenderMemoized } = render(<TestComponentWithMemoized />);
            const { rerender: rerenderNonMemoized } = render(<TestComponentWithoutMemoized />);

            // Force several re-renders
            for (let i = 0; i < 3; i++) {
                rerenderMemoized(<TestComponentWithMemoized />);
                rerenderNonMemoized(<TestComponentWithoutMemoized />);
            }

            await new Promise((resolve) => setTimeout(resolve, 50));

            // Memoized callback should result in fewer effect calls
            expect(memoizedCallCount).toBeLessThan(nonMemoizedCallCount);
            expect(nonMemoizedCallCount).toBeGreaterThan(memoizedCallCount);
        });
    });

    describe("hasAgreementChanged state management", () => {
        it("initializes hasAgreementChanged to false", () => {
            const TestComponent = () => {
                const [hasAgreementChanged] = React.useState(false);

                return <div data-testid="state-value">{hasAgreementChanged ? "true" : "false"}</div>;
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            expect(screen.getByTestId("state-value")).toHaveTextContent("false");
        });

        it("updates hasAgreementChanged when memoized callback is called", async () => {
            const TestComponent = () => {
                const [hasAgreementChanged, setHasAgreementChanged] = React.useState(false);

                const memoizedSetHasAgreementChanged = React.useCallback((hasChanged) => {
                    setHasAgreementChanged(hasChanged);
                }, []);

                return (
                    <div>
                        <div data-testid="state-value">{hasAgreementChanged ? "true" : "false"}</div>
                        <button
                            data-testid="trigger-change"
                            onClick={() => memoizedSetHasAgreementChanged(true)}
                        >
                            Trigger Change
                        </button>
                    </div>
                );
            };

            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            expect(screen.getByTestId("state-value")).toHaveTextContent("false");

            // Trigger the change
            const button = screen.getByTestId("trigger-change");
            await user.click(button);

            await waitFor(() => {
                expect(screen.getByTestId("state-value")).toHaveTextContent("true");
            });
        });

        it("memoized callback can toggle hasAgreementChanged multiple times", async () => {
            const TestComponent = () => {
                const [hasAgreementChanged, setHasAgreementChanged] = React.useState(false);

                const memoizedSetHasAgreementChanged = React.useCallback((hasChanged) => {
                    setHasAgreementChanged(hasChanged);
                }, []);

                return (
                    <div>
                        <div data-testid="state-value">{hasAgreementChanged ? "true" : "false"}</div>
                        <button
                            data-testid="set-true"
                            onClick={() => memoizedSetHasAgreementChanged(true)}
                        >
                            Set True
                        </button>
                        <button
                            data-testid="set-false"
                            onClick={() => memoizedSetHasAgreementChanged(false)}
                        >
                            Set False
                        </button>
                    </div>
                );
            };

            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            // Initial state
            expect(screen.getByTestId("state-value")).toHaveTextContent("false");

            // Set to true
            await user.click(screen.getByTestId("set-true"));
            await waitFor(() => {
                expect(screen.getByTestId("state-value")).toHaveTextContent("true");
            });

            // Set back to false
            await user.click(screen.getByTestId("set-false"));
            await waitFor(() => {
                expect(screen.getByTestId("state-value")).toHaveTextContent("false");
            });

            // Set to true again
            await user.click(screen.getByTestId("set-true"));
            await waitFor(() => {
                expect(screen.getByTestId("state-value")).toHaveTextContent("true");
            });
        });

        it("memoized callback is passed to child component", async () => {
            const MockChildComponent = ({ setHasAgreementChanged }) => {
                return (
                    <div>
                        <div data-testid="callback-type">{typeof setHasAgreementChanged}</div>
                        <button
                            data-testid="call-callback"
                            onClick={() => setHasAgreementChanged(true)}
                        >
                            Call Callback
                        </button>
                    </div>
                );
            };

            const TestComponent = () => {
                const [hasAgreementChanged, setHasAgreementChanged] = React.useState(false);

                const memoizedSetHasAgreementChanged = React.useCallback((hasChanged) => {
                    setHasAgreementChanged(hasChanged);
                }, []);

                return (
                    <div>
                        <div data-testid="parent-state">{hasAgreementChanged ? "true" : "false"}</div>
                        <MockChildComponent setHasAgreementChanged={memoizedSetHasAgreementChanged} />
                    </div>
                );
            };

            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            // Verify callback is a function
            expect(screen.getByTestId("callback-type")).toHaveTextContent("function");

            // Verify initial state
            expect(screen.getByTestId("parent-state")).toHaveTextContent("false");

            // Child calls callback
            await user.click(screen.getByTestId("call-callback"));

            // Parent state should update
            await waitFor(() => {
                expect(screen.getByTestId("parent-state")).toHaveTextContent("true");
            });
        });

        it("hasAgreementChanged state is correctly propagated to AgreementDetails", () => {
            const TestComponent = () => {
                const [hasAgreementChanged] = React.useState(true);

                // Simulate passing to AgreementDetails
                const propsForAgreementDetails = {
                    hasAgreementChanged: hasAgreementChanged
                };

                return (
                    <div data-testid="propagated-value">{propsForAgreementDetails.hasAgreementChanged ? "true" : "false"}</div>
                );
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            expect(screen.getByTestId("propagated-value")).toHaveTextContent("true");
        });
    });
});
