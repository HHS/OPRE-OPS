import React from "react";
import { vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SimpleAlert from "./SimpleAlert";

// An alert whose close button really closes it, the way callers wire setIsAlertVisible.
const ClosingAlert = () => {
    const [isAlertVisible, setIsAlertVisible] = React.useState(true);
    return (
        <SimpleAlert
            message="Closable"
            type="warning"
            isClosable={true}
            isAlertVisible={isAlertVisible}
            setIsAlertVisible={setIsAlertVisible}
        />
    );
};

describe("SimpleAlert", () => {
    it("should render", () => {
        render(
            <SimpleAlert
                heading="Test Heading"
                message="Test Message"
                type="success"
            />
        );
        const heading = screen.getByRole("heading", { name: "Test Heading", level: 4 });
        const message = screen.getByText("Test Message");
        expect(heading).toBeInTheDocument();
        expect(message).toBeInTheDocument();
    });
    it("should render with children", () => {
        render(
            <SimpleAlert
                heading="Test Heading"
                message="Test Message"
                type="success"
            >
                <div>Test Children</div>
            </SimpleAlert>
        );
        const children = screen.getByText("Test Children");
        expect(children).toBeInTheDocument();
    });
    it("should render with warning type", () => {
        render(
            <SimpleAlert
                heading="Test Heading"
                message="Test Message"
                type="warning"
            />
        );
        const alert = screen.getByTestId("alert");
        expect(alert).toHaveClass("usa-alert--warning");
    });
    it("should render with error type", () => {
        render(
            <SimpleAlert
                heading="Test Heading"
                message="Test Message"
                type="error"
            />
        );
        const alert = screen.getByRole("alert");
        expect(alert).toHaveClass("usa-alert--error");
    });
    it("should be closable", async () => {
        const setIsAlertVisible = vi.fn();
        const { rerender } = render(
            <SimpleAlert
                heading="Test Heading"
                message="Test Message"
                type="error"
                isClosable={true}
                isAlertVisible={true}
                setIsAlertVisible={setIsAlertVisible}
            />
        );
        const closeButton = screen.getByLabelText("close");
        expect(closeButton).toBeInTheDocument();
        fireEvent.click(closeButton);
        expect(setIsAlertVisible).toHaveBeenCalledWith(false);
        // Rerender the component with the updated prop
        rerender(
            <SimpleAlert
                heading="Test Heading"
                message="Test Message"
                type="error"
                isClosable={true}
                isAlertVisible={false}
                setIsAlertVisible={setIsAlertVisible}
            />
        );
        // Wait for the alert to be removed from the DOM
        await waitFor(() => {
            expect(screen.queryByRole("status", { name: "alert" })).not.toBeInTheDocument();
        });
    });
    it("should preserve line breaks in multi-line messages", () => {
        render(
            <SimpleAlert
                heading="Test Heading"
                message="Line 1\n\nLine 2"
                type="success"
            />
        );
        // ReactMarkdown handles newlines by creating separate paragraphs
        expect(screen.getByText(/Line 1/)).toBeInTheDocument();
        expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    });
    it("should render with custom heading level", () => {
        render(
            <SimpleAlert
                heading="Test Heading"
                message="Test Message"
                type="success"
                headingLevel={2}
            />
        );
        const heading = screen.getByRole("heading", { name: "Test Heading", level: 2 });
        expect(heading).toBeInTheDocument();
    });
    it("should validate heading level within range 1-6", () => {
        const { rerender } = render(
            <SimpleAlert
                heading="Test Heading"
                message="Test Message"
                type="success"
                headingLevel={0}
            />
        );
        let heading = screen.getByRole("heading", { name: "Test Heading" });
        expect(heading.tagName).toBe("H1");

        rerender(
            <SimpleAlert
                heading="Test Heading"
                message="Test Message"
                type="success"
                headingLevel={7}
            />
        );
        heading = screen.getByRole("heading", { name: "Test Heading" });
        expect(heading.tagName).toBe("H6");
    });

    it("moves focus to the next focusable element when closed, so it doesn't drop to the page body", () => {
        const Page = () => {
            const [isAlertVisible, setIsAlertVisible] = React.useState(true);
            return (
                <main
                    id="main-content"
                    tabIndex={-1}
                >
                    <button type="button">Before</button>
                    <SimpleAlert
                        message="Closable"
                        type="warning"
                        isClosable={true}
                        isAlertVisible={isAlertVisible}
                        setIsAlertVisible={setIsAlertVisible}
                    />
                    <button type="button">After</button>
                </main>
            );
        };
        render(<Page />);

        fireEvent.click(screen.getByLabelText("close"));

        expect(screen.queryByText("Closable")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("moves focus to the main content when nothing focusable follows the alert", () => {
        render(
            <main
                id="main-content"
                tabIndex={-1}
            >
                <ClosingAlert />
            </main>
        );

        fireEvent.click(screen.getByLabelText("close"));

        expect(screen.getByRole("main")).toHaveFocus();
    });

    it("skips a following element that can't take focus", () => {
        render(
            <main
                id="main-content"
                tabIndex={-1}
            >
                <ClosingAlert />
                <button
                    type="button"
                    // Matches the focusable selector but won't take focus (e.g. hidden or inert).
                    ref={(element) => {
                        if (element) element.focus = () => {};
                    }}
                >
                    Unfocusable
                </button>
                <button type="button">Next</button>
            </main>
        );

        fireEvent.click(screen.getByLabelText("close"));

        expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    });

    it("leaves focus on the close button when the caller doesn't close the alert", () => {
        render(
            <main
                id="main-content"
                tabIndex={-1}
            >
                <SimpleAlert
                    message="Still here"
                    type="error"
                    isClosable={true}
                />
                <button type="button">Next</button>
            </main>
        );
        const close = screen.getByLabelText("close");
        close.focus();

        fireEvent.click(close);

        expect(screen.getByText("Still here")).toBeInTheDocument();
        expect(close).toHaveFocus();
    });

    it("moves focus on when the parent unmounts the alert to close it", () => {
        const Page = () => {
            const [isAlertVisible, setIsAlertVisible] = React.useState(true);
            return (
                <main
                    id="main-content"
                    tabIndex={-1}
                >
                    {isAlertVisible && (
                        <SimpleAlert
                            message="Closable"
                            type="warning"
                            isClosable={true}
                            setIsAlertVisible={setIsAlertVisible}
                        />
                    )}
                    <button type="button">After</button>
                </main>
            );
        };
        render(<Page />);

        fireEvent.click(screen.getByLabelText("close"));

        expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    // The pre-award, award and contract-mod notification alerts close only after a PATCH and a
    // refetch, so the user can move on before the alert unmounts.
    const LateClosingPage = ({ isAlertShown, setIsAlertVisible }) => (
        <main
            id="main-content"
            tabIndex={-1}
        >
            {isAlertShown && (
                <SimpleAlert
                    message="Closes later"
                    type="success"
                    isClosable={true}
                    setIsAlertVisible={setIsAlertVisible}
                />
            )}
            <button type="button">After</button>
            <button type="button">Further on</button>
        </main>
    );

    it("leaves focus where the user moved it when the alert closes later", () => {
        const setIsAlertVisible = vi.fn();
        const { rerender } = render(
            <LateClosingPage
                isAlertShown={true}
                setIsAlertVisible={setIsAlertVisible}
            />
        );

        const close = screen.getByLabelText("close");
        close.focus();
        fireEvent.click(close);
        expect(setIsAlertVisible).toHaveBeenCalledWith(false);
        screen.getByRole("button", { name: "Further on" }).focus();
        rerender(
            <LateClosingPage
                isAlertShown={false}
                setIsAlertVisible={setIsAlertVisible}
            />
        );

        expect(screen.getByRole("button", { name: "Further on" })).toHaveFocus();
    });

    it("doesn't move focus later when a close button with no setter was clicked", () => {
        const { rerender } = render(<LateClosingPage isAlertShown={true} />);
        const close = screen.getByLabelText("close");
        close.focus();

        fireEvent.click(close);
        // e.g. the award-approval error alert, cleared when the user submits again
        rerender(<LateClosingPage isAlertShown={false} />);

        expect(document.body).toHaveFocus();
        expect(screen.getByRole("button", { name: "After" })).not.toHaveFocus();
    });
});
