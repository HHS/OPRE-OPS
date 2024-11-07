import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import TermTag from "./TermTag";

// Mock the Tag component with proper type
vi.mock("../Tag", () => ({
    default: ({ text }) => <span data-testid="mock-tag">{text}</span>
}));

describe("TermTag", () => {
    it("renders with required term prop", () => {
        render(<TermTag term="Test Term" />);

        expect(screen.getByText("Test Term")).toBeInTheDocument();
        expect(screen.getByTestId("mock-tag")).toHaveTextContent("TBD");
    });

    it("renders with custom description", () => {
        render(
            <TermTag
                term="Test Term"
                description="Custom Description"
            />
        );

        expect(screen.getByText("Test Term")).toBeInTheDocument();
        expect(screen.getByTestId("mock-tag")).toHaveTextContent("Custom Description");
    });

    it("applies custom className", () => {
        render(
            <TermTag
                term="Test Term"
                className="custom-class"
            />
        );

        const container = screen.getByTestId("term-container");
        expect(container).toHaveClass("custom-class", "font-12px");
    });

    it("renders with default description when not provided", () => {
        render(<TermTag term="Test Term" />);

        expect(screen.getByTestId("mock-tag")).toHaveTextContent("TBD");
    });

    it("maintains correct structure and classes", () => {
        render(
            <TermTag
                term="Test Term"
                description="Description"
            />
        );

        const container = screen.getByTestId("term-container");

        // Test term element
        const term = within(container).getByText("Test Term");
        expect(term).toHaveClass("margin-0", "text-base-dark", "margin-top-3");

        // Test description container
        const descriptionList = within(container).getByRole("definition");
        expect(descriptionList).toHaveClass("margin-0", "margin-top-1");
    });

    it("renders with multiple classes when className is provided", () => {
        render(
            <TermTag
                term="Test Term"
                className="class1 class2"
            />
        );

        const container = screen.getByTestId("term-container");
        expect(container).toHaveClass("font-12px", "class1", "class2");
    });
});
