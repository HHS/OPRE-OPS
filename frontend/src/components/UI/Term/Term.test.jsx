import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Term from "./Term";

describe("Term", () => {
    it("renders with name as label when label is not provided", () => {
        render(
            <Term
                name="test-name"
                value="test-value"
            />
        );

        expect(screen.getByText("test-name")).toBeInTheDocument();
        expect(screen.getByText("test-value")).toBeInTheDocument();
    });

    it("renders with provided label instead of name", () => {
        render(
            <Term
                name="test-name"
                label="Test Label"
                value="test-value"
            />
        );

        expect(screen.getByText("Test Label")).toBeInTheDocument();
        expect(screen.queryByText("test-name")).not.toBeInTheDocument();
    });

    it('renders "TBD" when no value is provided', () => {
        render(
            <Term
                name="test-name"
                value="TBD"
            />
        );

        expect(screen.getByText("TBD")).toBeInTheDocument();
    });

    it("applies pending class when pending is true", () => {
        render(
            <Term
                name="test-name"
                value="test-value"
                pending={true}
            />
        );

        const container = screen.getByTestId("term-container");
        expect(container).toHaveClass("usa-form-group", "pending");
    });

    it("does not apply pending class when pending is false", () => {
        render(
            <Term
                name="test-name"
                value="test-value"
                pending={false}
            />
        );

        const container = screen.getByTestId("term-container");
        expect(container).toHaveClass("usa-form-group");
        expect(container).not.toHaveClass("pending");
    });

    it("renders error message when messages array is not empty", () => {
        const errorMessage = "This is an error message";
        render(
            <Term
                name="test-name"
                value="test-value"
                messages={[errorMessage]}
            />
        );

        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(errorMessage);
        expect(alert).toHaveClass("usa-error-message");
    });

    it("does not render error message when messages array is empty", () => {
        render(
            <Term
                name="test-name"
                value="test-value"
                messages={[]}
            />
        );

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("applies custom className when provided", () => {
        render(
            <Term
                name="test-name"
                value="test-value"
                className="custom-class"
            />
        );

        const container = screen.getByTestId("term-container");
        expect(container).toHaveClass("custom-class");
    });

    it("renders with all props provided", () => {
        const props = {
            name: "test-name",
            label: "Test Label",
            value: "test-value",
            pending: true,
            messages: ["Error message"],
            className: "custom-class"
        };

        render(<Term {...props} />);

        // Check label and value
        expect(screen.getByText("Test Label")).toBeInTheDocument();
        expect(screen.getByText("test-value")).toBeInTheDocument();

        // Check error message
        expect(screen.getByRole("alert")).toHaveTextContent("Error message");

        // Check classes
        const container = screen.getByTestId("term-container");
        expect(container).toHaveClass("usa-form-group", "pending", "custom-class");
    });

    it("renders value as string when number is provided", () => {
        render(
            <Term
                name="test-name"
                value={42}
            />
        );

        expect(screen.getByText("42")).toBeInTheDocument();
    });
});
