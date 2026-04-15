import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ReviewExecutingTotalAccordion from "./ReviewExecutingTotalAccordion";

describe("ReviewExecutingTotalAccordion", () => {
    it("renders with correct heading", () => {
        render(<ReviewExecutingTotalAccordion executingTotal={1000000} />);
        expect(screen.getByText("Review Executing Total")).toBeInTheDocument();
    });

    it("displays the executing total amount", () => {
        render(<ReviewExecutingTotalAccordion executingTotal={1000000} />);
        expect(screen.getByText(/\$ 1,000,000/)).toBeInTheDocument();
    });

    it("displays default instructions text", () => {
        render(<ReviewExecutingTotalAccordion executingTotal={500000} />);
        expect(screen.getByText(/Review the total of all budget lines in Executing Status/)).toBeInTheDocument();
    });

    it("displays custom instructions when provided", () => {
        const customInstructions = "Custom instruction text for testing";
        render(
            <ReviewExecutingTotalAccordion
                executingTotal={500000}
                instructions={customInstructions}
            />
        );
        expect(screen.getByText(customInstructions)).toBeInTheDocument();
    });

    it("handles zero total correctly", () => {
        render(<ReviewExecutingTotalAccordion executingTotal={0} />);
        expect(screen.getByText(/\$ 0/)).toBeInTheDocument();
    });
});
