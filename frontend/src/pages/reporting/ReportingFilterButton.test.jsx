import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReportingFilterButton from "./ReportingFilterButton";

vi.mock("../../components/Portfolios/PortfoliosComboBox", () => ({
    default: ({ selectedPortfolios, defaultString }) => (
        <div data-testid="portfolios-combobox">{selectedPortfolios.length > 0 ? "Selected" : defaultString}</div>
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

    it("should call setFilters with empty portfolios on reset", () => {
        const mockSetFilters = vi.fn();
        render(
            <ReportingFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
            />
        );

        fireEvent.click(screen.getByTestId("reset-btn"));
        expect(mockSetFilters).toHaveBeenCalledWith({ portfolios: [] });
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
});
