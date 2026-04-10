import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StepLegendItem from "./StepLegendItem";

describe("StepLegendItem", () => {
    const defaultProps = {
        id: 1,
        activeId: null,
        label: "Step 1",
        value: 5,
        color: "#ff0000",
        percent: 25
    };

    it("renders label, value, and percent", () => {
        render(<StepLegendItem {...defaultProps} />);
        expect(screen.getByText("Step 1")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("25%")).toBeInTheDocument();
    });

    it("renders circle icon with correct color", () => {
        render(<StepLegendItem {...defaultProps} />);
        const icon = screen.getByRole("img", { name: "Step 1 indicator" });
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveStyle({ color: "#ff0000" });
    });

    it("applies bold style when active", () => {
        render(
            <StepLegendItem
                {...defaultProps}
                activeId={1}
            />
        );
        expect(screen.getByText("Step 1")).toHaveClass("fake-bold");
        expect(screen.getByText("5")).toHaveClass("fake-bold");
    });

    it("does not apply bold style when not active", () => {
        render(
            <StepLegendItem
                {...defaultProps}
                activeId={2}
            />
        );
        expect(screen.getByText("Step 1")).not.toHaveClass("fake-bold");
        expect(screen.getByText("5")).not.toHaveClass("fake-bold");
    });
});
