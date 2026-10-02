import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReleaseNotesList from "./ReleaseNotesList";

vi.mock("./data", () => ({
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

vi.mock("../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        formatDateToMonthDayYear: vi.fn((date) => `Formatted ${date}`)
    };
});

describe("ReleaseNotesList", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the latest release as a plain expanded section by default", () => {
        render(<ReleaseNotesList />);

        expect(screen.getByRole("heading", { level: 2, name: "Release Notes: 1.129.0" })).toBeInTheDocument();
        expect(screen.getByText("CSRF Protection")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Release Notes 1.129.0/ })).not.toBeInTheDocument();
    });

    it("renders the latest release in an Accordion when wrapLatestInAccordion is true", () => {
        render(<ReleaseNotesList wrapLatestInAccordion />);

        expect(
            screen.getByRole("button", { name: /Release Notes 1.129.0 - Formatted 2025-06-24/ })
        ).toBeInTheDocument();
        expect(screen.queryByRole("heading", { level: 2, name: "Release Notes: 1.129.0" })).not.toBeInTheDocument();
        expect(screen.getByText("CSRF Protection")).toBeInTheDocument();
    });

    it("renders older releases in closed accordions regardless of wrapLatestInAccordion", () => {
        render(<ReleaseNotesList wrapLatestInAccordion />);

        expect(
            screen.getByRole("button", { name: /Release Notes 1.128.0 - Formatted 2025-06-20/ })
        ).toBeInTheDocument();
    });
});
