import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ReleaseNotes from "./ReleaseNotes";

// Mock the data module
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
                },
                {
                    id: "21749dd",
                    subject: "Bug Fix",
                    type: "Fixes",
                    description: "Fixed an issue with health check endpoint."
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

// Mock the formatDateToMonthDayYear function
vi.mock("../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        formatDateToMonthDayYear: vi.fn((date) => `Formatted ${date}`)
    };
});

describe("ReleaseNotes Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the main heading", () => {
        render(<ReleaseNotes />);

        expect(screen.getByRole("heading", { level: 1, name: "OPS Release Summary" })).toBeInTheDocument();
    });

    it("renders the latest release heading", () => {
        render(<ReleaseNotes />);

        expect(screen.getByRole("heading", { level: 2, name: "Release Notes: 1.129.0" })).toBeInTheDocument();
    });

    it("renders release notes cards with correct props", () => {
        render(<ReleaseNotes />);

        // Check that the latest version is displayed
        expect(screen.getByText("Version 1.129.0")).toBeInTheDocument();

        // Check that the formatted date is displayed
        expect(screen.getByText("Formatted 2025-06-24")).toBeInTheDocument();
    });

    it("renders all changes from the latest release", () => {
        render(<ReleaseNotes />);

        // Check that both changes from the latest release are rendered
        expect(screen.getByText("CSRF Protection")).toBeInTheDocument();
        expect(screen.getByText("Bug Fix")).toBeInTheDocument();
        expect(screen.getByText("Enhanced CSRF protection by allowing OPTIONS and HEAD methods.")).toBeInTheDocument();
        expect(screen.getByText("Fixed an issue with health check endpoint.")).toBeInTheDocument();
    });

    it("renders previous releases in accordions", () => {
        render(<ReleaseNotes />);

        // Check that previous release is rendered in an accordion
        expect(
            screen.getByRole("button", { name: /Release Notes 1.128.0 - Formatted 2025-06-20/ })
        ).toBeInTheDocument();
    });

    it("calculates correct counts for different change types", () => {
        render(<ReleaseNotes />);

        // The latest release has 1 New Feature and 1 Fix
        // Check that the total changes count is displayed (this would be 2)
        expect(screen.getByText("2")).toBeInTheDocument(); // Total changes
    });

    it("renders the latest release section", () => {
        render(<ReleaseNotes />);

        // Check that the latest release section exists by finding content within it
        expect(screen.getByText("CSRF Protection")).toBeInTheDocument();
        expect(screen.getByText("Bug Fix")).toBeInTheDocument();
    });
});
