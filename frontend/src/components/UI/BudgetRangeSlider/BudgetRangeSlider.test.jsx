import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BudgetRangeSlider from "./BudgetRangeSlider";

// Mock ResizeObserver
class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

window.ResizeObserver = ResizeObserver;

describe("BudgetRangeSlider", () => {
    it("should render with correct initial values", () => {
        const mockSetSelectedRange = vi.fn();
        render(
            <BudgetRangeSlider
                budgetRange={[0, 1000]}
                selectedRange={[100, 500]}
                setSelectedRange={mockSetSelectedRange}
            />
        );

        expect(screen.getByText("Budget Range")).toBeInTheDocument();
        expect(screen.getByText(/\$\s*100(?!\.)/)).toBeInTheDocument();
        expect(screen.getByText("to")).toBeInTheDocument();
        expect(screen.getByText(/\$\s*500(?!\.)/)).toBeInTheDocument();
    });

    it("should use custom label when provided", () => {
        render(
            <BudgetRangeSlider
                budgetRange={[0, 1000]}
                selectedRange={[100, 500]}
                setSelectedRange={() => {}}
                label="Budget Line Total"
            />
        );

        expect(screen.getByText("Budget Line Total")).toBeInTheDocument();
    });

    it("should use custom legend class name when provided", () => {
        render(
            <BudgetRangeSlider
                budgetRange={[0, 1000]}
                selectedRange={[100, 500]}
                setSelectedRange={() => {}}
                legendClassname="custom-legend-class"
            />
        );

        expect(screen.getByText("Budget Range")).toHaveClass("custom-legend-class");
    });

    it("gives each thumb a distinct accessible name derived from the label prop", () => {
        render(
            <BudgetRangeSlider
                budgetRange={[0, 1000]}
                selectedRange={[100, 500]}
                setSelectedRange={() => {}}
                label="Budget Line Total"
            />
        );

        const [minThumb, maxThumb] = screen.getAllByRole("slider");
        expect(minThumb).toHaveAttribute("aria-label", "Budget Line Total minimum");
        expect(maxThumb).toHaveAttribute("aria-label", "Budget Line Total maximum");
    });

    it("falls back to the default label for each thumb's accessible name when label is omitted", () => {
        render(
            <BudgetRangeSlider
                budgetRange={[0, 1000]}
                selectedRange={[100, 500]}
                setSelectedRange={() => {}}
            />
        );

        const [minThumb, maxThumb] = screen.getAllByRole("slider");
        expect(minThumb).toHaveAttribute("aria-label", "Budget Range minimum");
        expect(maxThumb).toHaveAttribute("aria-label", "Budget Range maximum");
    });

    it("should update the selected range when the slider is moved", async () => {
        const user = userEvent.setup();
        const mockSetSelectedRange = vi.fn();
        render(
            <BudgetRangeSlider
                budgetRange={[0, 1000]}
                selectedRange={[100, 500]}
                setSelectedRange={mockSetSelectedRange}
            />
        );

        const sliders = screen.getAllByRole("slider");
        const firstSlider = sliders[0];

        await user.type(firstSlider, "{arrowright}".repeat(5));

        await vi.waitFor(() => {
            expect(mockSetSelectedRange).toHaveBeenCalled();
        });
    });
});
