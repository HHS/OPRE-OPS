import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CANFYBudgetRangeSlider from "./CANFYBudgetRangeSlider";

// Mock ResizeObserver
class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

window.ResizeObserver = ResizeObserver;

describe("CANFYBudgetRangeSlider", () => {
    it("should render with correct initial values", () => {
        const mockSetBudget = vi.fn();
        render(
            <CANFYBudgetRangeSlider
                fyBudgetRange={[0, 1000]}
                budget={[100, 500]}
                setBudget={mockSetBudget}
            />
        );

        expect(screen.getByText("FY Budget")).toBeInTheDocument();
        expect(screen.getByText("$ 100")).toBeInTheDocument();
        expect(screen.getByText("to")).toBeInTheDocument();
        expect(screen.getByText("$ 500")).toBeInTheDocument();
    });

    it("should update budget when slider is moved", async () => {
        const user = userEvent.setup();
        const mockSetBudget = vi.fn();
        render(
            <CANFYBudgetRangeSlider
                fyBudgetRange={[0, 1000]}
                budget={[100, 500]}
                setBudget={mockSetBudget}
            />
        );

        const sliders = screen.getAllByRole("slider");
        const firstSlider = sliders[0];

        // Move the slider to 25% of its range
        await user.type(firstSlider, "{arrowright}".repeat(25));

        // Wait for any asynchronous updates
        await vi.waitFor(() => {
            expect(mockSetBudget).toHaveBeenCalled();
        });
    });

    it("should use custom legend class name when provided", () => {
        render(
            <CANFYBudgetRangeSlider
                fyBudgetRange={[0, 1000]}
                budget={[100, 500]}
                setBudget={() => {}}
                legendClassname="custom-legend-class"
            />
        );

        expect(screen.getByText("FY Budget")).toHaveClass("custom-legend-class");
    });
});
