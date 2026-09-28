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

    it("renders the latest release heading", () => {
        render(<ReleaseNotes />);

        expect(screen.getByRole("heading", { level: 2, name: "Release Notes 1.129.0" })).toBeInTheDocument();
    });

    it("renders the instructions for the latest release", () => {
        render(<ReleaseNotes />);

        expect(screen.getByText("This is a list of what's new from our latest release.")).toBeInTheDocument();
    });

    it("renders all changes from the latest release", () => {
        render(<ReleaseNotes />);

        // Check that both changes from the latest release are rendered
        expect(screen.getByText("CSRF Protection")).toBeInTheDocument();
        expect(screen.getByText("Bug Fix")).toBeInTheDocument();
        expect(screen.getByText("Enhanced CSRF protection by allowing OPTIONS and HEAD methods.")).toBeInTheDocument();
        expect(screen.getByText("Fixed an issue with health check endpoint.")).toBeInTheDocument();
    });

    it("renders the type tag for each change", () => {
        render(<ReleaseNotes />);

        expect(screen.getByText("New Feature")).toBeInTheDocument();
        expect(screen.getByText("Fixes")).toBeInTheDocument();
    });

    it("renders previous releases in accordions", () => {
        render(<ReleaseNotes />);

        // Check that previous release is rendered in an accordion
        expect(
            screen.getByRole("button", { name: /Release Notes 1.128.0 - Formatted 2025-06-20/ })
        ).toBeInTheDocument();
    });

    it("renders changes from previous releases inside their accordion", () => {
        render(<ReleaseNotes />);

        expect(screen.getByText("Performance Improvement")).toBeInTheDocument();
        expect(screen.getByText("Enhanced performance of CSRF protection.")).toBeInTheDocument();
    });
});
