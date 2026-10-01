import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import ReleaseNotesSummaryCard from "./ReleaseNotesSummaryCard";

// Asymmetric counts (2 new features, 1 fix, 3 improvements) so a mislabeled filter or
// swapped constant would change the rendered tags, and the total (6) is distinct from
// every per-category count.
vi.mock("./data", () => ({
    data: [
        {
            releaseDate: "2026-09-11",
            version: "1.464.3",
            changes: [
                { id: "001", subject: "View a Grant", type: "New Feature", description: "" },
                { id: "002", subject: "Edit a Grant", type: "New Feature", description: "" },
                { id: "003", subject: "Bug fix", type: "Fixes", description: "" },
                { id: "004", subject: "Perf 1", type: "Improvements", description: "" },
                { id: "005", subject: "Perf 2", type: "Improvements", description: "" },
                { id: "006", subject: "Perf 3", type: "Improvements", description: "" }
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

    it("renders the total release-change count", () => {
        renderWithProviders(<ReleaseNotesSummaryCard />);
        expect(screen.getByText("6")).toBeInTheDocument();
    });

    it("renders per-category tags with correct counts and pluralization", () => {
        renderWithProviders(<ReleaseNotesSummaryCard />);
        expect(screen.getByText("2 New Features")).toBeInTheDocument();
        expect(screen.getByText("1 Fix")).toBeInTheDocument();
        expect(screen.getByText("3 Improvements")).toBeInTheDocument();
    });
});
