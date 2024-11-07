import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Card from "./Card";

describe("Card", () => {
    it("renders children correctly", () => {
        render(
            <Card>
                <div>Test Content</div>
            </Card>
        );

        expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("renders title when provided", () => {
        render(
            <Card title="Test Title">
                <div>Test Content</div>
            </Card>
        );

        const heading = screen.getByRole("heading", { name: "Test Title" });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveClass("margin-0", "margin-bottom-3", "font-12px", "text-base-dark", "text-normal");
    });

    it("does not render title when not provided", () => {
        render(
            <Card>
                <div>Test Content</div>
            </Card>
        );

        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("applies data-cy attribute when provided", () => {
        render(
            <Card dataCy="test-card">
                <div>Test Content</div>
            </Card>
        );

        // Using getByTestId instead of closest
        expect(screen.getByTestId("test-card")).toBeInTheDocument();
    });

    it("renders multiple children", () => {
        render(
            <Card>
                <div>First Child</div>
                <div>Second Child</div>
            </Card>
        );

        expect(screen.getByText("First Child")).toBeInTheDocument();
        expect(screen.getByText("Second Child")).toBeInTheDocument();
    });

    it("renders with title and multiple children", () => {
        render(
            <Card title="Card Title">
                <div>First Child</div>
                <div>Second Child</div>
            </Card>
        );

        expect(screen.getByRole("heading", { name: "Card Title" })).toBeInTheDocument();
        expect(screen.getByText("First Child")).toBeInTheDocument();
        expect(screen.getByText("Second Child")).toBeInTheDocument();
    });

    it("renders children within the data-cy container", () => {
        render(
            <Card dataCy="test-card">
                <div>Test Content</div>
            </Card>
        );

        const container = screen.getByTestId("test-card");
        expect(within(container).getByText("Test Content")).toBeInTheDocument();
    });
});
