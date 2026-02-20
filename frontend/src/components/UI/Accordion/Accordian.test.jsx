import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import Accordion from "./Accordion";

/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */

describe("Accordion component", () => {
    const defaultProps = {
        heading: "Test Heading",
        level: 3,
        children: <div>Test Content</div>
    };

    it("renders the accordion with correct heading and content", () => {
        render(<Accordion {...defaultProps} />);

        expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
        expect(screen.getByText("Test Heading")).toBeInTheDocument();
        expect(screen.getByText("Test Content")).toBeInTheDocument();
    });
    it("supports ReactNode headings", () => {
        render(
            <Accordion
                heading={<span>Rich Heading</span>}
                level={3}
            >
                <div>Test Content</div>
            </Accordion>
        );

        expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /rich heading/i })).toBeInTheDocument();
    });
    it("sets data-cy when provided", () => {
        const { container } = render(
            <Accordion
                heading="Test Heading"
                level={3}
                dataCy="custom-accordion"
            >
                <div>Test Content</div>
            </Accordion>
        );

        expect(container.querySelector('[data-cy="custom-accordion"]')).toBeInTheDocument();
    });
    it("does not set data-cy when dataCy is not provided", () => {
        const { container } = render(<Accordion {...defaultProps} />);

        expect(container.querySelector(".usa-accordion")).not.toHaveAttribute("data-cy");
    });
    it("sets the heading level correctly", () => {
        render(<Accordion {...defaultProps} />);

        const heading = screen.getByRole("heading", { level: 3 });
        expect(heading).toBeInTheDocument();
    });
    it("toggles the accordion content visibility when clicked", async () => {
        render(<Accordion {...defaultProps} />);

        const button = screen.getByRole("button", { name: /test heading/i });
        expect(button).toHaveAttribute("aria-expanded", "true");

        // Simulate a click to collapse the accordion
        await userEvent.click(button);
        expect(button).toHaveAttribute("aria-expanded", "false");

        // Simulate a click to expand the accordion
        await userEvent.click(button);
        expect(button).toHaveAttribute("aria-expanded", "true");
    });
    it("toggles the accordion content visibility with Enter key", async () => {
        render(<Accordion {...defaultProps} />);

        const button = screen.getByRole("button", { name: /test heading/i });
        expect(button).toHaveAttribute("aria-expanded", "true");

        // Focus the button first to ensure keyboard events target it
        button.focus();

        // Simulate pressing the Enter key to collapse the accordion
        await userEvent.keyboard("{Enter}");
        expect(button).toHaveAttribute("aria-expanded", "false");

        // Simulate pressing the Enter key to expand the accordion
        await userEvent.keyboard("{Enter}");
        expect(button).toHaveAttribute("aria-expanded", "true");
    });
    it("removes bottom padding when accordion is closed via prop", () => {
        const { container, rerender } = render(<Accordion {...defaultProps} />);
        expect(container.querySelector(".usa-accordion")).toHaveClass("padding-bottom-6");

        rerender(
            <Accordion
                {...defaultProps}
                isClosed
            />
        );

        expect(container.querySelector(".usa-accordion")).not.toHaveClass("padding-bottom-6");
    });
    it("throws an error for invalid heading level", () => {
        const invalidProps = { ...defaultProps, level: 7 };

        expect(() => render(<Accordion {...invalidProps} />)).toThrow(/unrecognized heading level/i);
    });
    it("throws an error for invalid heading level button", () => {
        const invalidProps = { ...defaultProps, level: "button" };

        expect(() => render(<Accordion {...invalidProps} />)).toThrow(/unrecognized heading level/i);
    });
});
