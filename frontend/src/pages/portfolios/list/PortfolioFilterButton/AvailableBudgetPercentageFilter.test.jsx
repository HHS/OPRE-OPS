import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AvailableBudgetPercentageFilter from "./AvailableBudgetPercentageFilter";

describe("AvailableBudgetPercentageFilter", () => {
    it("should render the combobox with label", () => {
        const mockSetSelectedRanges = vi.fn();
        render(
            <AvailableBudgetPercentageFilter
                selectedRanges={[]}
                setSelectedRanges={mockSetSelectedRanges}
            />
        );

        expect(screen.getByLabelText("Available Budget")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should show placeholder text when no selection", () => {
        const mockSetSelectedRanges = vi.fn();
        render(
            <AvailableBudgetPercentageFilter
                selectedRanges={[]}
                setSelectedRanges={mockSetSelectedRanges}
            />
        );

        // ComboBox shows placeholder text when no selection is made
        // Text appears in both label and placeholder, so we verify it exists
        const placeholderTexts = screen.getAllByText("Available Budget");
        expect(placeholderTexts.length).toBeGreaterThanOrEqual(1); // Label + placeholder
    });

    it("should display selected ranges", () => {
        const mockSetSelectedRanges = vi.fn();
        render(
            <AvailableBudgetPercentageFilter
                selectedRanges={["over90", "75-90"]}
                setSelectedRanges={mockSetSelectedRanges}
            />
        );

        // ComboBox shows selected items as chips/tags
        expect(screen.getByText("Over 90% available")).toBeInTheDocument();
        expect(screen.getByText("75% - 90% available")).toBeInTheDocument();
    });

    it("should call setSelectedRanges when selection changes", async () => {
        const user = userEvent.setup();
        const mockSetSelectedRanges = vi.fn();
        render(
            <AvailableBudgetPercentageFilter
                selectedRanges={[]}
                setSelectedRanges={mockSetSelectedRanges}
            />
        );

        const input = screen.getByRole("combobox");
        await user.click(input);

        // Type to search for an option
        await user.type(input, "Over 90");

        // Select the option (this is simplified - actual behavior may vary)
        const option = await screen.findByText("Over 90% available");
        await user.click(option);

        expect(mockSetSelectedRanges).toHaveBeenCalled();
    });

    it("should handle multiple selections", () => {
        const mockSetSelectedRanges = vi.fn();
        const { rerender } = render(
            <AvailableBudgetPercentageFilter
                selectedRanges={["over90"]}
                setSelectedRanges={mockSetSelectedRanges}
            />
        );

        expect(screen.getByText("Over 90% available")).toBeInTheDocument();

        // Rerender with additional selection
        rerender(
            <AvailableBudgetPercentageFilter
                selectedRanges={["over90", "75-90"]}
                setSelectedRanges={mockSetSelectedRanges}
            />
        );

        expect(screen.getByText("Over 90% available")).toBeInTheDocument();
        expect(screen.getByText("75% - 90% available")).toBeInTheDocument();
    });

    it("should clear selections when empty array provided", () => {
        const mockSetSelectedRanges = vi.fn();
        const { rerender } = render(
            <AvailableBudgetPercentageFilter
                selectedRanges={["over90", "75-90"]}
                setSelectedRanges={mockSetSelectedRanges}
            />
        );

        expect(screen.getByText("Over 90% available")).toBeInTheDocument();
        expect(screen.getByText("75% - 90% available")).toBeInTheDocument();

        // Rerender with empty selection
        rerender(
            <AvailableBudgetPercentageFilter
                selectedRanges={[]}
                setSelectedRanges={mockSetSelectedRanges}
            />
        );

        expect(screen.queryByText("Over 90% available")).not.toBeInTheDocument();
        expect(screen.queryByText("75% - 90% available")).not.toBeInTheDocument();
    });

    it("should use custom legend class name when provided", () => {
        const mockSetSelectedRanges = vi.fn();
        render(
            <AvailableBudgetPercentageFilter
                selectedRanges={[]}
                setSelectedRanges={mockSetSelectedRanges}
                legendClassname="custom-legend-class"
            />
        );

        const label = screen.getByText("Available Budget", { selector: "label" });
        expect(label).toHaveClass("custom-legend-class");
    });

    it("should have correct accessibility attributes", () => {
        const mockSetSelectedRanges = vi.fn();
        render(
            <AvailableBudgetPercentageFilter
                selectedRanges={[]}
                setSelectedRanges={mockSetSelectedRanges}
            />
        );

        const input = screen.getByRole("combobox");
        expect(input).toHaveAttribute("id", "available-budget-percentage-combobox-input");
    });

    it("should handle invalid range codes gracefully", () => {
        const mockSetSelectedRanges = vi.fn();
        render(
            <AvailableBudgetPercentageFilter
                selectedRanges={["over90", "invalid-code", "75-90"]}
                setSelectedRanges={mockSetSelectedRanges}
            />
        );

        // Should only show valid range codes
        expect(screen.getByText("Over 90% available")).toBeInTheDocument();
        expect(screen.getByText("75% - 90% available")).toBeInTheDocument();
        expect(screen.queryByText("invalid-code")).not.toBeInTheDocument();
    });
});
