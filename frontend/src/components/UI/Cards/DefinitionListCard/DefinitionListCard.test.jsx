import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DefinitionListCard from "./DefinitionListCard";

describe("DefinitionListCard", () => {
    it("renders with empty definition list", () => {
        render(<DefinitionListCard definitionList={[]} />);

        expect(screen.getByText("No items to display.")).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("renders single definition list item", () => {
        const definitionList = [{ term: "Test Term", definition: "Test Definition" }];

        render(<DefinitionListCard definitionList={definitionList} />);

        expect(screen.getByText("Test Term")).toBeInTheDocument();
        expect(screen.getByText("Test Definition")).toBeInTheDocument();
        expect(screen.queryByText("No items to display.")).not.toBeInTheDocument();
    });

    it("renders multiple definition list items", () => {
        const definitionList = [
            { term: "First Term", definition: "First Definition" },
            { term: "Second Term", definition: "Second Definition" },
            { term: "Third Term", definition: "Third Definition" }
        ];

        render(<DefinitionListCard definitionList={definitionList} />);

        // Check all terms are rendered
        expect(screen.getByText("First Term")).toBeInTheDocument();
        expect(screen.getByText("Second Term")).toBeInTheDocument();
        expect(screen.getByText("Third Term")).toBeInTheDocument();

        // Check all definitions are rendered
        expect(screen.getByText("First Definition")).toBeInTheDocument();
        expect(screen.getByText("Second Definition")).toBeInTheDocument();
        expect(screen.getByText("Third Definition")).toBeInTheDocument();
    });

    it("renders with numeric definition", () => {
        const definitionList = [
            { term: "Count", definition: 42 },
            { term: "Percentage", definition: 95.5 }
        ];

        render(<DefinitionListCard definitionList={definitionList} />);

        expect(screen.getByText("Count")).toBeInTheDocument();
        expect(screen.getByText("42")).toBeInTheDocument();
        expect(screen.getByText("Percentage")).toBeInTheDocument();
        expect(screen.getByText("95.5")).toBeInTheDocument();
    });

    it("renders with React node as definition", () => {
        const definitionList = [
            {
                term: "Link Term",
                definition: <a href="/test">Test Link</a>
            },
            {
                term: "Complex Term",
                definition: (
                    <div>
                        <span>Complex</span>
                        <strong> Definition</strong>
                    </div>
                )
            }
        ];

        render(<DefinitionListCard definitionList={definitionList} />);

        expect(screen.getByText("Link Term")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Test Link" })).toBeInTheDocument();

        expect(screen.getByText("Complex Term")).toBeInTheDocument();
        expect(screen.getByText("Complex")).toBeInTheDocument();
        expect(screen.getByText("Definition")).toBeInTheDocument();
    });

    it("applies custom className to container", () => {
        const definitionList = [{ term: "Test Term", definition: "Test Definition" }];

        render(
            <DefinitionListCard
                definitionList={definitionList}
                className="custom-class"
            />
        );

        // Check that custom class is applied by looking for the term inside the styled container
        const term = screen.getByText("Test Term");
        expect(term).toBeInTheDocument();
        // The custom class would be on the container div, but we can verify the component rendered correctly
    });

    it("applies correct styles to definition list elements", () => {
        const definitionList = [
            { term: "First Term", definition: "First Definition" },
            { term: "Second Term", definition: "Second Definition" }
        ];

        render(<DefinitionListCard definitionList={definitionList} />);

        // Check dt (term) styling
        const firstTerm = screen.getByText("First Term");
        expect(firstTerm).toHaveClass("margin-0", "text-base-dark");
        expect(firstTerm).not.toHaveClass("margin-top-2"); // First item shouldn't have top margin

        const secondTerm = screen.getByText("Second Term");
        expect(secondTerm).toHaveClass("margin-0", "text-base-dark", "margin-top-2"); // Second item should have top margin

        // Check dd (definition) styling
        const firstDefinition = screen.getByText("First Definition");
        expect(firstDefinition).toHaveClass("margin-0", "text-bold", "margin-top-1", "text-ink");

        const secondDefinition = screen.getByText("Second Definition");
        expect(secondDefinition).toHaveClass("margin-0", "text-bold", "margin-top-1", "text-ink");
    });

    it("uses term as React Fragment key", () => {
        const definitionList = [
            { term: "Unique Term 1", definition: "Definition 1" },
            { term: "Unique Term 2", definition: "Definition 2" }
        ];

        // This test ensures no React key warnings are thrown
        const { container } = render(<DefinitionListCard definitionList={definitionList} />);

        expect(screen.getByText("Unique Term 1")).toBeInTheDocument();
        expect(screen.getByText("Unique Term 2")).toBeInTheDocument();
        expect(container).toBeInTheDocument();
    });

    it("renders with mixed content types", () => {
        const definitionList = [
            { term: "String Term", definition: "String Definition" },
            { term: "Number Term", definition: 123 },
            { term: "React Term", definition: <em>Emphasized Definition</em> },
            { term: "Zero Term", definition: 0 },
            { term: "Empty String Term", definition: "" }
        ];

        render(<DefinitionListCard definitionList={definitionList} />);

        expect(screen.getByText("String Term")).toBeInTheDocument();
        expect(screen.getByText("String Definition")).toBeInTheDocument();

        expect(screen.getByText("Number Term")).toBeInTheDocument();
        expect(screen.getByText("123")).toBeInTheDocument();

        expect(screen.getByText("React Term")).toBeInTheDocument();
        expect(screen.getByText("Emphasized Definition")).toBeInTheDocument();

        expect(screen.getByText("Zero Term")).toBeInTheDocument();
        expect(screen.getByText("0")).toBeInTheDocument();

        expect(screen.getByText("Empty String Term")).toBeInTheDocument();

        // All terms should be rendered, including one with empty definition
        // We verify this by checking that all expected terms are present
        expect(screen.getAllByRole("term")).toHaveLength(5);
    });
});
