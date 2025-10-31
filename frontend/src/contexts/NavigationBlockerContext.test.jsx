import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { NavigationBlockerProvider } from "./NavigationBlockerContext";

// Mock react-router-dom
const mockBlocker = {
    state: "unblocked",
    proceed: vi.fn(),
    reset: vi.fn()
};

vi.mock("react-router-dom", () => ({
    useBlocker: vi.fn(() => mockBlocker)
}));

// Mock SaveChangesAndExitModal
vi.mock("../components/UI/Modals/SaveChangesAndExitModal", () => ({
    default: function MockSaveChangesAndExitModal(props) {
        return (
            <div data-testid="save-changes-modal">
                <h2>{props.heading}</h2>
                <p>{props.description}</p>
                <button onClick={props.handleConfirm} data-testid="confirm-button">
                    {props.actionButtonText}
                </button>
                <button onClick={props.handleSecondary} data-testid="secondary-button">
                    {props.secondaryButtonText}
                </button>
                <button onClick={props.resetBlocker} data-testid="reset-button">
                    Reset
                </button>
            </div>
        );
    }
}));

// Import the actual context for testing
import NavigationBlockerContext from "./NavigationBlockerContext";

// Test component that uses the context
const TestComponent = ({ onRegister }) => {
    const contextValue = React.useContext(NavigationBlockerContext);

    React.useEffect(() => {
        if (onRegister && contextValue) {
            onRegister(contextValue);
        }
    }, [contextValue, onRegister]);

    return (
        <div data-testid="test-component">
            {contextValue ? "Context Available" : "No Context"}
        </div>
    );
};

describe("NavigationBlockerProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBlocker.state = "unblocked";
    });

    it("provides navigation blocker context to children", () => {
        render(
            <NavigationBlockerProvider>
                <TestComponent />
            </NavigationBlockerProvider>
        );

        expect(screen.getByText("Context Available")).toBeInTheDocument();
    });

    it("registers and unregisters blockers correctly", () => {
        let contextValue = null;
        const handleRegister = (ctx) => {
            contextValue = ctx;
        };

        render(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        // Register a blocker
        const unregister = contextValue.registerBlocker({
            id: "test-blocker",
            shouldBlock: true,
            modalProps: {
                heading: "Test Heading",
                description: "Test Description"
            }
        });

        expect(typeof unregister).toBe("function");

        // Unregister the blocker
        unregister();

        // Should be able to call unregister without error
        expect(() => unregister()).not.toThrow();
    });

    it("updates blocker conditions correctly", () => {
        let contextValue = null;
        const handleRegister = (ctx) => {
            contextValue = ctx;
        };

        render(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        // Register a blocker
        contextValue.registerBlocker({
            id: "test-blocker",
            shouldBlock: false,
            modalProps: {}
        });

        // Update the blocker
        contextValue.updateBlocker("test-blocker", {
            shouldBlock: true,
            modalProps: { heading: "Updated Heading" }
        });

        // Should not throw error when updating non-existent blocker
        expect(() => {
            contextValue.updateBlocker("non-existent", { shouldBlock: true });
        }).not.toThrow();
    });

    it("shows modal when blocker state becomes blocked", async () => {
        let contextValue = null;
        const handleRegister = (ctx) => {
            contextValue = ctx;
        };

        const { rerender } = render(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        // Register a blocker
        contextValue.registerBlocker({
            id: "test-blocker",
            shouldBlock: true,
            modalProps: {
                heading: "Unsaved Changes",
                description: "You have unsaved changes",
                actionButtonText: "Save & Exit",
                secondaryButtonText: "Exit Without Saving"
            }
        });

        // Simulate blocker becoming blocked
        mockBlocker.state = "blocked";
        rerender(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("save-changes-modal")).toBeInTheDocument();
        });

        expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
        expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();
        expect(screen.getByText("Save & Exit")).toBeInTheDocument();
        expect(screen.getByText("Exit Without Saving")).toBeInTheDocument();
    });

    it("handles modal confirm action correctly", async () => {
        let contextValue = null;
        const handleRegister = (ctx) => {
            contextValue = ctx;
        };
        const mockConfirm = vi.fn();

        const { rerender } = render(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        // Register a blocker with confirm handler
        contextValue.registerBlocker({
            id: "test-blocker",
            shouldBlock: true,
            modalProps: {
                heading: "Test",
                handleConfirm: mockConfirm
            }
        });

        // Simulate blocker becoming blocked
        mockBlocker.state = "blocked";
        rerender(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("save-changes-modal")).toBeInTheDocument();
        });

        // Click confirm button
        fireEvent.click(screen.getByTestId("confirm-button"));

        await waitFor(() => {
            expect(mockConfirm).toHaveBeenCalled();
            expect(mockBlocker.proceed).toHaveBeenCalled();
        });
    });

    it("handles modal secondary action correctly", async () => {
        let contextValue = null;
        const handleRegister = (ctx) => {
            contextValue = ctx;
        };
        const mockSecondary = vi.fn();

        const { rerender } = render(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        // Register a blocker with secondary handler
        contextValue.registerBlocker({
            id: "test-blocker",
            shouldBlock: true,
            modalProps: {
                heading: "Test",
                handleSecondary: mockSecondary
            }
        });

        // Simulate blocker becoming blocked
        mockBlocker.state = "blocked";
        rerender(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("save-changes-modal")).toBeInTheDocument();
        });

        // Click secondary button
        fireEvent.click(screen.getByTestId("secondary-button"));

        await waitFor(() => {
            expect(mockSecondary).toHaveBeenCalled();
            expect(mockBlocker.proceed).toHaveBeenCalled();
        });
    });

    it("handles modal reset action correctly", async () => {
        let contextValue = null;
        const handleRegister = (ctx) => {
            contextValue = ctx;
        };

        const { rerender } = render(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        // Register a blocker
        contextValue.registerBlocker({
            id: "test-blocker",
            shouldBlock: true,
            modalProps: { heading: "Test" }
        });

        // Simulate blocker becoming blocked
        mockBlocker.state = "blocked";
        rerender(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("save-changes-modal")).toBeInTheDocument();
        });

        // Click reset button
        fireEvent.click(screen.getByTestId("reset-button"));

        await waitFor(() => {
            expect(mockBlocker.reset).toHaveBeenCalled();
        });
    });

    it("provides correct blocker state in context", () => {
        let contextValue = null;
        const handleRegister = (ctx) => {
            contextValue = ctx;
        };

        render(
            <NavigationBlockerProvider>
                <TestComponent onRegister={handleRegister} />
            </NavigationBlockerProvider>
        );

        expect(contextValue.blockerState).toBe("unblocked");
        expect(contextValue.isBlocked).toBe(false);

        // Test with blocked state
        mockBlocker.state = "blocked";
        expect(contextValue.isBlocked).toBe(false); // This will be false until re-render
    });
});
