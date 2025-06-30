import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ReleaseNotesCards from "./ReleaseNotesCards";

describe("ReleaseNotesCards Component", () => {
    const mockProps = {
        releaseDate: "December 15, 2024",
        lastVersion: "2.1.0",
        totalReleaseChanges: 5,
        totalNewFeatures: 2,
        totalFixes: 2,
        totalImprovements: 1
    };

    it("renders the release date", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getAllByText("December 15, 2024")).toHaveLength(2); // Appears in both cards
    });

    it("renders the version number", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getByText("Version 2.1.0")).toBeInTheDocument();
    });

    it("renders the total release changes count", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders new features count with correct text", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getByText("2 New Features")).toBeInTheDocument();
    });

    it("renders fixes count with correct text", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getByText("2 Fixes")).toBeInTheDocument();
    });

    it("renders improvements count with correct text", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getByText("1 Improvement")).toBeInTheDocument();
    });

    it("renders singular text for single counts", () => {
        const singleCountProps = {
            ...mockProps,
            totalNewFeatures: 1,
            totalFixes: 1,
            totalImprovements: 1
        };

        render(<ReleaseNotesCards {...singleCountProps} />);

        expect(screen.getByText("1 New Feature")).toBeInTheDocument();
        expect(screen.getByText("1 Fix")).toBeInTheDocument();
        expect(screen.getByText("1 Improvement")).toBeInTheDocument();
    });

    it("does not render sections with zero counts", () => {
        const zeroCountProps = {
            ...mockProps,
            totalNewFeatures: 0,
            totalFixes: 0,
            totalImprovements: 0
        };

        render(<ReleaseNotesCards {...zeroCountProps} />);

        expect(screen.queryByText(/New Feature/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Fix/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Improvement/)).not.toBeInTheDocument();
    });

    it("renders the last data update heading", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getByText("Last Data Update *")).toBeInTheDocument();
    });

    it("renders the last release heading", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getByText("Last Release")).toBeInTheDocument();
    });

    it("renders the OPS version heading", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getByText("OPS Version")).toBeInTheDocument();
    });

    it("renders the release changes heading", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getByText("Release Changes")).toBeInTheDocument();
    });

    it("renders the data sync explanation text", () => {
        render(<ReleaseNotesCards {...mockProps} />);

        expect(screen.getByText(/budget team.*spreadsheet.*synced/)).toBeInTheDocument();
    });
});
