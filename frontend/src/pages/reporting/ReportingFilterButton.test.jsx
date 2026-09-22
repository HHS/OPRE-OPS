import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReportingFilterButton from "./ReportingFilterButton";

vi.mock("../../components/Portfolios/PortfoliosComboBox", () => ({
    default: ({ selectedPortfolios, defaultString, usePrefetchedOptions }) => (
        <div
            data-testid="portfolios-combobox"
            data-prefetched={usePrefetchedOptions}
        >
            {selectedPortfolios.length > 0 ? "Selected" : defaultString}
        </div>
    )
}));

vi.mock("../../components/UI/FilterButton/FilterButton", () => ({
    default: ({ applyFilter, resetFilter, fieldsetList }) => (
        <div data-testid="filter-button">
            {fieldsetList}
            <button
                data-testid="apply-btn"
                onClick={applyFilter}
            >
                Apply
            </button>
            <button
                data-testid="reset-btn"
                onClick={resetFilter}
            >
                Reset
            </button>
        </div>
    )
}));

describe("ReportingFilterButton", () => {
    const defaultFilters = { portfolios: [] };

    it("should render the filter button with portfolios combobox", () => {
        render(
            <ReportingFilterButton
                filters={defaultFilters}
                setFilters={vi.fn()}
            />
        );
        expect(screen.getByTestId("filter-button")).toBeInTheDocument();
        expect(screen.getByTestId("portfolios-combobox")).toBeInTheDocument();
    });

    it("should show 'All Portfolios' as default placeholder", () => {
        render(
            <ReportingFilterButton
                filters={defaultFilters}
                setFilters={vi.fn()}
            />
        );
        expect(screen.getByText("All Portfolios")).toBeInTheDocument();
    });

    it("should NOT call setFilters on reset — Reset only clears the local buffer", () => {
        const mockSetFilters = vi.fn();
        render(
            <ReportingFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
            />
        );

        fireEvent.click(screen.getByTestId("reset-btn"));
        expect(mockSetFilters).not.toHaveBeenCalled();
    });

    it("should call setFilters on apply", () => {
        const mockSetFilters = vi.fn();
        render(
            <ReportingFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
            />
        );

        fireEvent.click(screen.getByTestId("apply-btn"));
        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("reset then apply commits empty portfolios to parent", () => {
        const mockSetFilters = vi.fn();
        render(
            <ReportingFilterButton
                filters={{ portfolios: [{ id: 1, name: "OPRE" }] }}
                setFilters={mockSetFilters}
            />
        );

        fireEvent.click(screen.getByTestId("reset-btn"));
        expect(mockSetFilters).not.toHaveBeenCalled(); // Reset fires nothing

        fireEvent.click(screen.getByTestId("apply-btn"));
        expect(mockSetFilters).toHaveBeenCalled(); // Apply commits []
        const updater = mockSetFilters.mock.calls[0][0];
        expect(updater({ portfolios: [{ id: 1, name: "OPRE" }] }).portfolios).toEqual([]);
    });
});
