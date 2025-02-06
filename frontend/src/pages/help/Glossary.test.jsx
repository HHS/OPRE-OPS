import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import Glossary from "./Glossary";

describe("Glossary Component", () => {
    it("renders the Glossary heading and table of contents", () => {
        render(<Glossary />);
        // Check main heading
        expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Glossary");
        // Check that a Table of Contents link (e.g., letter "A") is present
        expect(screen.getByRole("link", { name: "A" })).toBeInTheDocument();
    });

    it("scrolls to section after clicking a letter link", async () => {
        render(<Glossary />);
        const user = userEvent.setup();
        // Click on any available TOC link, for example "A"
        const letterLink = screen.getByRole("link", { name: "A" });
        await user.click(letterLink);
        // Check that the section header for "A" appears
        expect(screen.getByRole("heading", { level: 3, name: "A" })).toBeInTheDocument();
    });
});
