import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Feedback from "./Feedback";

describe("Feedback Component", () => {
    it("renders the feedback heading and description", () => {
        render(<Feedback />);
        // Check heading
        expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("We’d love to hear from you!");
        // Check description text presence
        expect(screen.getByText(/You’re feedback is important to us/i)).toBeInTheDocument();
    });

    it("contains contact links", () => {
        render(<Feedback />);
        // Check for the feedback email link
        const emailLink = screen.getByRole("link", { name: "ops-feedback@formsgoogle.com" });
        expect(emailLink).toBeInTheDocument();
    });
});
