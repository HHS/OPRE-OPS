import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import HowToGuides from "./HowToGuides";

describe("How-to Guides Page", () => {
    it("renders header and table of contents", () => {
        render(<HowToGuides />);
        // Check header
        expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("How-to Guides");
        // Check a TOC link exists
        expect(screen.getByRole("link", { name: /What is OPS\?/i })).toBeInTheDocument();
    });

    it("expands accordion on click", async () => {
        render(<HowToGuides />);
        // Assume the accordion heading renders as a button
        const accordionButton = screen.getByRole("button", { name: /What is OPS\?/i });
        await userEvent.click(accordionButton);
        // Check if accordion content is displayed after click
        expect(screen.getByText(/OPS stands for OPRE’s Portfolio Management System/i)).toBeInTheDocument();
    });
});
