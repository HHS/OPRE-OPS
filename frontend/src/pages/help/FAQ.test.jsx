import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import FAQ from "./FAQ";

describe("FAQ Component", () => {
    it("renders FAQ title", () => {
        render(<FAQ />);
        // Check the heading for FAQ section
        expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Frequently Asked Questions");
    });

    it("expands an FAQ item on click", async () => {
        render(<FAQ />);
        const user = userEvent.setup();
        // Click the first FAQ accordion item (assumed to render as a button)
        const accordionButton = screen.getByRole("button", {
            name: /How do I get started in OPS or learn how to use it\?/i
        });
        await user.click(accordionButton);
        // Check that FAQ content appears after the accordion expands
        expect(screen.getByText(/You can learn how to use OPS by checking out the How-to Guides/i)).toBeInTheDocument();
    });
});
