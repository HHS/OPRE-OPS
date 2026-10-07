import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WhatsNewContent from "./WhatsNewContent";

vi.mock("../release-notes/data", () => ({
    data: [
        {
            version: "1.129.0",
            releaseDate: "2025-06-24",
            changes: [
                {
                    id: "a2cb655",
                    subject: "CSRF Protection",
                    type: "New Feature",
                    description: "Enhanced CSRF protection by allowing OPTIONS and HEAD methods."
                }
            ]
        },
        {
            version: "1.128.0",
            releaseDate: "2025-06-20",
            changes: [
                {
                    id: "ebf278c",
                    subject: "Performance Improvement",
                    type: "Improvements",
                    description: "Enhanced performance of CSRF protection."
                }
            ]
        }
    ]
}));

describe("WhatsNewContent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the What's New heading and subtitle", () => {
        render(<WhatsNewContent />);

        expect(screen.getByRole("heading", { level: 2, name: "What's New" })).toBeInTheDocument();
        expect(screen.getByText(/This is a list of release notes/)).toBeInTheDocument();
    });

    it("renders the latest release in an open Accordion, per Figma", () => {
        render(<WhatsNewContent />);

        const latestButton = screen.getByRole("button", { name: /Release Notes 1.129.0/ });
        expect(latestButton).toBeInTheDocument();
        expect(latestButton).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText("CSRF Protection")).toBeInTheDocument();
    });

    it("nests the release accordion headings under the tab's own h2", () => {
        render(<WhatsNewContent />);

        expect(
            screen.getByRole("heading", { level: 3, name: /Release Notes 1.129.0/ })
        ).toBeInTheDocument();
    });

    it("renders older releases in closed accordions", () => {
        render(<WhatsNewContent />);

        const olderButton = screen.getByRole("button", { name: /Release Notes 1.128.0/ });
        expect(olderButton).toBeInTheDocument();
        expect(olderButton).toHaveAttribute("aria-expanded", "false");
    });
});
