import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ReleaseNote from "./ReleaseNote";
import { RELEASE_NOTES_TYPES } from "./constants";

describe("ReleaseNote Component", () => {
    const mockProps = {
        subject: "Test Feature",
        type: /** @type {"New Feature"|"Improvements"|"Fixes"} */ (RELEASE_NOTES_TYPES.NEW_FEATURE),
        description: "This is a test description for a new feature."
    };

    it("renders the subject as a heading", () => {
        render(<ReleaseNote {...mockProps} />);

        expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Test Feature");
    });

    it("renders the description", () => {
        render(<ReleaseNote {...mockProps} />);

        expect(screen.getByText("This is a test description for a new feature.")).toBeInTheDocument();
    });

    it("renders the type tag with correct text for New Feature", () => {
        render(<ReleaseNote {...mockProps} />);

        expect(screen.getByText("New Feature")).toBeInTheDocument();
    });

    it("renders the type tag with correct text for Improvements", () => {
        const improvementProps = {
            ...mockProps,
            type: /** @type {"New Feature"|"Improvements"|"Fixes"} */ (RELEASE_NOTES_TYPES.IMPROVEMENTS)
        };

        render(<ReleaseNote {...improvementProps} />);

        expect(screen.getByText("Improvements")).toBeInTheDocument();
    });

    it("renders the type tag with correct text for Fixes", () => {
        const fixProps = {
            ...mockProps,
            type: /** @type {"New Feature"|"Improvements"|"Fixes"} */ (RELEASE_NOTES_TYPES.FIXES)
        };

        render(<ReleaseNote {...fixProps} />);

        expect(screen.getByText("Fixes")).toBeInTheDocument();
    });

    it("renders as an article element", () => {
        render(<ReleaseNote {...mockProps} />);

        expect(screen.getByRole("article")).toBeInTheDocument();
    });
});
