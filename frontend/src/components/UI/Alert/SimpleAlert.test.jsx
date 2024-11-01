import { vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SimpleAlert from "./SimpleAlert";

describe("SimpleAlert", () => {
    it("should render ", () => {
        render(
            <SimpleAlert
                heading="Test Heading"
                message="Test Message"
                type="success"
            />
        );
        const heading = screen.getByRole("heading", { name: "Test Heading" });
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
        const close = screen.getByRole("img", { name: "close" });
        expect(close).toBeInTheDocument();
        fireEvent.click(close);
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
});
