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
    default: ({ applyFilter, resetFilter, fieldsetList, setShowModal }) => (
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
            <button
                data-testid="open-modal-btn"
                onClick={() => setShowModal?.(true)}
            >
                Open
            </button>
            <button
                data-testid="close-modal-btn"
                onClick={() => setShowModal?.(false)}
            >
                Close
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

    it("reopen after Reset-without-Apply reseeds modal from active filters", () => {
        // Scenario: user has portfolio filter active, opens modal, clicks Reset (clears buffer),
        // closes modal without applying, reopens modal — should show active filter, not cleared state.
        render(
            <ReportingFilterButton
                filters={{ portfolios: [{ id: 1, name: "OPRE" }] }}
                setFilters={vi.fn()}
            />
        );

        // Modal opens → reseed fires → buffer = [{id:1, name:"OPRE"}] → shows "Selected"
        fireEvent.click(screen.getByTestId("open-modal-btn"));
        expect(screen.getByTestId("portfolios-combobox")).toHaveTextContent("Selected");

        // Reset clears buffer → shows placeholder
        fireEvent.click(screen.getByTestId("reset-btn"));
        expect(screen.getByTestId("portfolios-combobox")).toHaveTextContent("All Portfolios");

        // Close modal without applying (showModal → false)
        fireEvent.click(screen.getByTestId("close-modal-btn"));

        // Reopen modal → showModal transitions false→true → reseed fires from parent filters
        fireEvent.click(screen.getByTestId("open-modal-btn"));
        expect(screen.getByTestId("portfolios-combobox")).toHaveTextContent("Selected");
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
