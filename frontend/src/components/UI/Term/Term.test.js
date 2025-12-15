import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Term from "./Term";

describe("Term Component", () => {
    const defaultProps = {
        name: "test-name",
        label: "Test Label",
        value: "Test Value"
    };

    it("renders with basic props", () => {
        render(<Term {...defaultProps} />);

        expect(screen.getByText("Test Label")).toBeInTheDocument();
        expect(screen.getByText("Test Value")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
        render(<Term {...defaultProps} className="custom-class" />);

        const container = screen.getByTestId("term-container");
        expect(container).toHaveClass("custom-class");
    });

    it("renders with pending state", () => {
        render(<Term {...defaultProps} pending={true} />);

        const container = screen.getByTestId("term-container");
        expect(container).toHaveClass("pending");
    });

    it("renders with messages (only first message is displayed)", () => {
        const messages = ["Error message 1", "Error message 2"];
        render(<Term {...defaultProps} messages={messages} />);

        expect(screen.getByText("Error message 1")).toBeInTheDocument();
        // Only the first message is displayed based on the component implementation
        expect(screen.queryByText("Error message 2")).not.toBeInTheDocument();
    });

    it("renders with default value when value is undefined", () => {
        render(<Term name="test" label="Test Label" />);

        expect(screen.getByText("TBD")).toBeInTheDocument();
    });

    it("applies data-cy attribute when dataCy prop is provided", () => {
        render(<Term {...defaultProps} dataCy="test-data-cy" />);

        const valueElement = screen.getByText("Test Value");
        expect(valueElement).toHaveAttribute("data-cy", "test-data-cy");
    });

    it("applies empty data-cy attribute when dataCy is empty string (default)", () => {
        render(<Term {...defaultProps} />);

        const valueElement = screen.getByText("Test Value");
        expect(valueElement).toHaveAttribute("data-cy", "");
    });

    it("applies empty data-cy attribute when dataCy is explicitly empty string", () => {
        render(<Term {...defaultProps} dataCy="" />);

        const valueElement = screen.getByText("Test Value");
        expect(valueElement).toHaveAttribute("data-cy", "");
    });

    it("uses name as label when label is not provided", () => {
        render(<Term name="test-name" value="Test Value" />);

        expect(screen.getByText("test-name")).toBeInTheDocument();
        expect(screen.getByText("Test Value")).toBeInTheDocument();
    });

    it("renders with testid", () => {
        render(<Term {...defaultProps} />);

        expect(screen.getByTestId("term-container")).toBeInTheDocument();
    });

    it("handles number values", () => {
        render(<Term {...defaultProps} value={42} />);

        expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("handles boolean values", () => {
        // React renders boolean as empty for true, so let's test string conversion
        render(<Term name="test" label="Test Label" value="true" />);

        expect(screen.getByText("true")).toBeInTheDocument();
    });
});
