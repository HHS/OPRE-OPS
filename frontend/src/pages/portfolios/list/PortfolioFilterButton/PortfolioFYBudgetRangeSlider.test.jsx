import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PortfolioFYBudgetRangeSlider from "./PortfolioFYBudgetRangeSlider";

// Mock ResizeObserver
class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

window.ResizeObserver = ResizeObserver;

describe("PortfolioFYBudgetRangeSlider", () => {
    it("should render with correct initial values", () => {
        const mockSetBudget = vi.fn();
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[0, 100000000]}
                budget={[10000000, 50000000]}
                setBudget={mockSetBudget}
            />
        );

        expect(screen.getByText("Budget Range")).toBeInTheDocument();
        expect(screen.getByText("$ 10,000,000")).toBeInTheDocument();
        expect(screen.getByText("to")).toBeInTheDocument();
        expect(screen.getByText("$ 50,000,000")).toBeInTheDocument();
    });

    it("should render with small budget values", () => {
        const mockSetBudget = vi.fn();
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[0, 1000]}
                budget={[100, 500]}
                setBudget={mockSetBudget}
            />
        );

        expect(screen.getByText("$ 100")).toBeInTheDocument();
        expect(screen.getByText("$ 500")).toBeInTheDocument();
    });

    it("should format currency without decimal places", () => {
        const mockSetBudget = vi.fn();
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[0, 100000000]}
                budget={[1234567, 8765432]}
                setBudget={mockSetBudget}
            />
        );

        // Should format with commas and no decimal places
        expect(screen.getByText("$ 1,234,567")).toBeInTheDocument();
        expect(screen.getByText("$ 8,765,432")).toBeInTheDocument();
    });

    it("should update budget when slider is moved", async () => {
        const user = userEvent.setup();
        const mockSetBudget = vi.fn();
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[0, 100000000]}
                budget={[10000000, 50000000]}
                setBudget={mockSetBudget}
            />
        );

        const sliders = screen.getAllByRole("slider");
        const firstSlider = sliders[0];

        // Move the slider to the right
        await user.type(firstSlider, "{arrowright}".repeat(5));

        // Wait for any asynchronous updates
        await vi.waitFor(() => {
            expect(mockSetBudget).toHaveBeenCalled();
        });
    });

    it("should use custom legend class name when provided", () => {
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[0, 100000000]}
                budget={[10000000, 50000000]}
                setBudget={() => {}}
                legendClassname="custom-legend-class"
            />
        );

        expect(screen.getByText("Budget Range")).toHaveClass("custom-legend-class");
    });

    it("should use default legend class when not provided", () => {
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[0, 100000000]}
                budget={[10000000, 50000000]}
                setBudget={() => {}}
            />
        );

        expect(screen.getByText("Budget Range")).toHaveClass("usa-label", "margin-top-0");
    });

    it("should have correct data-testid", () => {
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[0, 100000000]}
                budget={[10000000, 50000000]}
                setBudget={() => {}}
            />
        );

        expect(screen.getByTestId("portfolio-fy-budget-range-slider")).toBeInTheDocument();
    });

    it("should render two sliders for min and max", () => {
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[0, 100000000]}
                budget={[10000000, 50000000]}
                setBudget={() => {}}
            />
        );

        const sliders = screen.getAllByRole("slider");
        expect(sliders).toHaveLength(2);
    });

    it("should handle full range values", () => {
        const mockSetBudget = vi.fn();
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[0, 100000000]}
                budget={[0, 100000000]}
                setBudget={mockSetBudget}
            />
        );

        expect(screen.getByText("$ 0")).toBeInTheDocument();
        expect(screen.getByText("$ 100,000,000")).toBeInTheDocument();
    });

    it("should handle edge case when fyBudgetRange min equals max", () => {
        const mockSetBudget = vi.fn();
        // This scenario occurs when only one portfolio has a valid budget
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[50000, 50000]}
                budget={[50000, 50000]}
                setBudget={mockSetBudget}
            />
        );

        // Should render without NaN values
        expect(screen.getByText("$ 50,000")).toBeInTheDocument();
        expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    });

    it("should handle slider interaction when fyBudgetRange min equals max", async () => {
        const user = userEvent.setup();
        const mockSetBudget = vi.fn();
        render(
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={[50000, 50000]}
                budget={[50000, 50000]}
                setBudget={mockSetBudget}
            />
        );

        const sliders = screen.getAllByRole("slider");
        const firstSlider = sliders[0];

        // Try to move the slider
        await user.type(firstSlider, "{arrowright}");

        // Should not cause errors or NaN values
        expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    });
});
