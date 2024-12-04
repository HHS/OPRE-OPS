import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LegendItem from "./LegendItem";

describe("LegendItem", () => {
    const defaultProps = {
        activeId: 1,
        id: 1,
        label: "Test Label",
        value: 1_000,
        color: "#000000",
        percent: "10%",
        tagStyleActive: "darkTextOnLightBlue"
    };

    it("renders with all props correctly", () => {
        render(<LegendItem {...defaultProps} />);

        expect(screen.getByText("Test Label")).toBeInTheDocument();
        expect(screen.getByText("$1,000.00")).toBeInTheDocument();
        expect(screen.getByText("10%")).toBeInTheDocument();
    });

    it("applies active styles when activeId matches id", () => {
        render(<LegendItem {...defaultProps} />);

        // Using data-testid for testing specific styling
        const labelContainer = screen.getByTestId("label-container");
        const valueContainer = screen.getByTestId("value-container");

        expect(labelContainer).toHaveClass("fake-bold");
        expect(valueContainer).toHaveClass("fake-bold");
    });

    it("does not apply active styles when activeId doesn't match id", () => {
        render(
            <LegendItem
                {...defaultProps}
                activeId={2}
            />
        );

        const labelContainer = screen.getByTestId("label-container");
        const valueContainer = screen.getByTestId("value-container");

        expect(labelContainer).not.toHaveClass("fake-bold");
        expect(valueContainer).not.toHaveClass("fake-bold");
    });

    it("renders with correct color", () => {
        render(<LegendItem {...defaultProps} />);

        const icon = screen.getByTestId("legend-icon");
        expect(icon).toHaveStyle({ color: "#000000" });
    });

    it("formats currency value correctly", () => {
        render(
            <LegendItem
                {...defaultProps}
                value={1234567}
            />
        );

        expect(screen.getByText("$1,234,567.00")).toBeInTheDocument();
    });

    it("renders Tag component with correct props", () => {
        render(<LegendItem {...defaultProps} />);

        const tag = screen.getByTestId("legend-tag");
        expect(tag).toBeInTheDocument();
        expect(tag).toHaveClass("bg-brand-feedback-info");
        expect(screen.getByText("10%")).toBeInTheDocument();
    });
});
