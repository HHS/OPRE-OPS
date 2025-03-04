import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Feedback from "./Feedback";

describe("Feedback Component", () => {
    it("renders the feedback heading and description", () => {
        render(<Feedback />);
        // Check heading
        expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Share Feedback");
        // Check description text presence
        expect(screen.getByText(/Your feedback matters to us!/i)).toBeInTheDocument();
    });

    it("contains contact links", () => {
        render(<Feedback />);
        // Check for the feedback email link
        const emailLink = screen.getByRole("link", { name: "opre-ops-support@flexion.us" });
        expect(emailLink).toBeInTheDocument();
    });
});
