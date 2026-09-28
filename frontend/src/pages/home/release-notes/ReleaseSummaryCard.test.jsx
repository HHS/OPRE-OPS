import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RELEASE_NOTES_TYPES } from "./constants";
import ReleaseSummaryCard from "./ReleaseSummaryCard";

const release = {
    version: "1.130.0",
    releaseDate: "2025-06-24",
    changes: [
        { id: "a", subject: "One", type: RELEASE_NOTES_TYPES.NEW_FEATURE, description: "..." },
        { id: "b", subject: "Two", type: RELEASE_NOTES_TYPES.NEW_FEATURE, description: "..." },
        { id: "c", subject: "Three", type: RELEASE_NOTES_TYPES.FIXES, description: "..." }
    ]
};

describe("ReleaseSummaryCard", () => {
    it("renders a column heading for each summary metric", () => {
        render(<ReleaseSummaryCard release={release} />);

        expect(screen.getByRole("heading", { level: 3, name: "Last Release" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "OPS Version" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "Release Changes" })).toBeInTheDocument();
    });

    it("renders the formatted release date and version", () => {
        render(<ReleaseSummaryCard release={release} />);

        expect(screen.getByText("June 24, 2025")).toBeInTheDocument();
        expect(screen.getByText("Version 1.130.0")).toBeInTheDocument();
    });

    it("renders the total change count and per-type breakdown", () => {
        render(<ReleaseSummaryCard release={release} />);

        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("2 New Features")).toBeInTheDocument();
        expect(screen.getByText("1 Fix")).toBeInTheDocument();
    });

    it("omits change types with no changes", () => {
        render(<ReleaseSummaryCard release={release} />);

        expect(screen.queryByText(/Improvement/)).not.toBeInTheDocument();
    });

    it("falls back to a placeholder when the release has no date", () => {
        render(<ReleaseSummaryCard release={{ ...release, releaseDate: "" }} />);

        expect(screen.getByText("--")).toBeInTheDocument();
    });

    it("renders nothing when there is no release", () => {
        const { container } = render(<ReleaseSummaryCard release={/** @type {any} */ (null)} />);

        expect(container).toBeEmptyDOMElement();
    });

    it("defaults to the latest release from the static data", () => {
        render(<ReleaseSummaryCard />);

        expect(screen.getByRole("heading", { level: 3, name: "OPS Version" })).toBeInTheDocument();
        expect(screen.getByText(/^Version /)).toBeInTheDocument();
    });
});
