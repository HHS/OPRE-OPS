import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import ReleaseNotesSummaryCard from "./ReleaseNotesSummaryCard";

vi.mock("./data", () => ({
    data: [
        {
            releaseDate: "2026-09-11",
            version: "1.464.3",
            changes: [
                { id: "001", subject: "View a Grant", type: "New Feature", description: "" },
                { id: "002", subject: "Bug fix", type: "Fixes", description: "" },
                { id: "003", subject: "Performance", type: "Improvements", description: "" }
            ]
        }
    ]
}));

describe("ReleaseNotesSummaryCard", () => {
    it("renders the Last Release label", () => {
        renderWithProviders(<ReleaseNotesSummaryCard />);
        expect(screen.getByText("Last Release")).toBeInTheDocument();
    });

    it("renders the version number", () => {
        renderWithProviders(<ReleaseNotesSummaryCard />);
        expect(screen.getByText("Version 1.464.3")).toBeInTheDocument();
    });

    it("renders change type tags", () => {
        renderWithProviders(<ReleaseNotesSummaryCard />);
        expect(screen.getByText("1 New Feature")).toBeInTheDocument();
        expect(screen.getByText("1 Fix")).toBeInTheDocument();
        expect(screen.getByText("1 Improvement")).toBeInTheDocument();
    });
});
