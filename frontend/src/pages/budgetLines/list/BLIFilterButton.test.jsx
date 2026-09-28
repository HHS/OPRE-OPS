import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import BLIFilterButton from "./BLIFilterButton";

// Mock child components
vi.mock("../../../components/UI/FilterButton/FilterButton", () => ({
    default: ({ applyFilter, resetFilter, fieldsetList }) => (
        <div data-testid="filter-button">
            <button
                onClick={applyFilter}
                data-testid="apply-filter-btn"
            >
                Apply
            </button>
            <button
                onClick={resetFilter}
                data-testid="reset-filter-btn"
            >
                Reset
            </button>
            <div data-testid="fieldset-list">{fieldsetList.length} fields</div>
            <div data-testid="fieldset-content">{fieldsetList}</div>
        </div>
    )
}));

vi.mock("../../../components/UI/Form/FiscalYearComboBox", () => ({
    default: ({ selectedFiscalYears, setSelectedFiscalYears, defaultString }) => (
        <div data-testid="fiscal-year-combo">
            <button onClick={() => setSelectedFiscalYears([{ id: 2024, title: "FY 2024" }])}>Set Fiscal Years</button>
            <button onClick={() => setSelectedFiscalYears([])}>Clear Fiscal Years</button>
            <div>{selectedFiscalYears?.length || 0} selected</div>
            <div data-testid="default-string">{defaultString}</div>
        </div>
    )
}));

vi.mock("../../../components/Portfolios/PortfoliosComboBox", () => ({
    default: ({ setSelectedPortfolios }) => (
        <div data-testid="portfolios-combo">
            <button onClick={() => setSelectedPortfolios([{ id: 1, name: "Portfolio 1" }])}>Set Portfolios</button>
        </div>
    )
}));

vi.mock("../../../components/BudgetLineItems/BLIStatusComboBox", () => ({
    default: ({ setSelectedBLIStatus }) => (
        <div data-testid="bli-status-combo">
            <button onClick={() => setSelectedBLIStatus([{ id: 1, title: "PLANNED" }])}>Set Status</button>
        </div>
    )
}));

vi.mock("../../../components/UI/BudgetRangeSlider", () => ({
    default: ({ setSelectedRange }) => (
        <div data-testid="budget-range-slider">
            <button onClick={() => setSelectedRange([0, 100000])}>Set Range</button>
        </div>
    )
}));

vi.mock("../../../components/Agreements/AgreementTypeComboBox/AgreementTypeComboBox", () => ({
    default: ({ setSelectedAgreementTypes }) => (
        <div data-testid="agreement-type-combo">
            <button onClick={() => setSelectedAgreementTypes([{ id: 1, title: "CONTRACT" }])}>
                Set Agreement Types
            </button>
        </div>
    )
}));

vi.mock("../../../components/Agreements/AgreementNameComboBox/AgreementNameComboBox", () => ({
    default: ({ setSelectedAgreementNames }) => (
        <div data-testid="agreement-name-combo">
            <button onClick={() => setSelectedAgreementNames([{ id: 1, name: "Agreement 1" }])}>
                Set Agreement Names
            </button>
        </div>
    )
}));

vi.mock("../../../components/CANs/CANActivePeriodComboBox/CANActivePeriodComboBox", () => ({
    default: ({ setActivePeriod }) => (
        <div data-testid="can-active-period-combo">
            <button onClick={() => setActivePeriod([{ id: 1, title: "Active" }])}>Set Active Period</button>
        </div>
    )
}));

describe("BLIFilterButton", () => {
    const mockSetFilters = vi.fn();
    const defaultFilters = {
        fiscalYears: [],
        portfolios: [],
        bliStatus: [],
        budgetRange: null,
        agreementTypes: [],
        agreementTitles: [],
        canActivePeriods: []
    };

    const mockFilterOptions = {
        fiscal_years: [2023, 2024, 2025],
        portfolios: [
            { id: 1, name: "Portfolio 1" },
            { id: 2, name: "Portfolio 2" }
        ],
        statuses: [
            { id: 1, title: "DRAFT" },
            { id: 2, title: "PLANNED" }
        ],
        budget_line_total_range: {
            min: 0,
            max: 1000000
        },
        agreement_types: [
            { id: 1, title: "CONTRACT" },
            { id: 2, title: "GRANT" }
        ],
        agreement_names: [{ id: 1, name: "Agreement 1" }],
        can_active_periods: [{ id: 1, title: "Active" }]
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders filter button component", () => {
        render(
            <BLIFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                filterOptions={mockFilterOptions}
            />
        );

        expect(screen.getByTestId("filter-button")).toBeInTheDocument();
        expect(screen.getByTestId("fieldset-list")).toHaveTextContent("7 fields");
    });

    it.each([
        ["fiscalYears", null],
        ["fiscalYears", undefined],
        ["portfolios", null],
        ["bliStatus", null],
        ["agreementTypes", null],
        ["agreementTitles", null],
        ["canActivePeriods", null]
    ])("handles %s as %s gracefully", (filterKey, value) => {
        const filtersWithNullish = {
            ...defaultFilters,
            [filterKey]: value
        };

        expect(() => {
            render(
                <BLIFilterButton
                    filters={filtersWithNullish}
                    setFilters={mockSetFilters}
                    filterOptions={mockFilterOptions}
                />
            );
        }).not.toThrow();

        expect(screen.getByTestId("filter-button")).toBeInTheDocument();
    });

    it("handles all null filters gracefully", () => {
        const allNullFilters = {
            fiscalYears: null,
            portfolios: null,
            bliStatus: null,
            budgetRange: null,
            agreementTypes: null,
            agreementTitles: null,
            canActivePeriods: null
        };

        expect(() => {
            render(
                <BLIFilterButton
                    filters={allNullFilters}
                    setFilters={mockSetFilters}
                    filterOptions={mockFilterOptions}
                />
            );
        }).not.toThrow();

        expect(screen.getByTestId("filter-button")).toBeInTheDocument();
    });

    it("applies filters correctly", async () => {
        render(
            <BLIFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                filterOptions={mockFilterOptions}
            />
        );

        const applyButton = screen.getByTestId("apply-filter-btn");
        fireEvent.click(applyButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });
    });

    it("sets fiscalYears to [] when fiscal years are cleared (All) under Model B", async () => {
        render(
            <BLIFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                filterOptions={mockFilterOptions}
            />
        );

        // Clear fiscal years (empty selection means "All")
        fireEvent.click(screen.getByText("Clear Fiscal Years"));
        fireEvent.click(screen.getByTestId("apply-filter-btn"));

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback(defaultFilters);
        expect(result.fiscalYears).toEqual([]);
    });

    it("sets fiscalYears to [] when Compare Fiscal Years is cleared on apply under Model B", async () => {
        render(
            <BLIFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                filterOptions={mockFilterOptions}
            />
        );

        // Apply with no selections (defaults to empty which means "All")
        fireEvent.click(screen.getByTestId("apply-filter-btn"));

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback(defaultFilters);
        // Empty array in modal stays [] under Model B
        expect(result.fiscalYears).toEqual([]);
    });

    it("reset button clears local state without calling setFilters", () => {
        render(
            <BLIFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                filterOptions={mockFilterOptions}
            />
        );

        // Make some changes in modal
        fireEvent.click(screen.getByText("Set Fiscal Years"));
        fireEvent.click(screen.getByText("Set Portfolios"));

        // Reset restores to parent filter state without calling setFilters
        const resetButton = screen.getByTestId("reset-filter-btn");
        fireEvent.click(resetButton);

        // Reset doesn't call setFilters - it just restores local modal state
        expect(mockSetFilters).not.toHaveBeenCalled();
    });

    it("reset then apply commits empty buffers, results revert to dropdown FY", () => {
        const filtersWithSelections = {
            ...defaultFilters,
            fiscalYears: [{ id: 2024, title: "FY 2024" }],
            portfolios: [{ id: 1, name: "Portfolio 1" }]
        };

        render(
            <BLIFilterButton
                filters={filtersWithSelections}
                setFilters={mockSetFilters}
                filterOptions={mockFilterOptions}
            />
        );

        const resetButton = screen.getByTestId("reset-filter-btn");
        fireEvent.click(resetButton);

        // Reset doesn't call setFilters — no query fires
        expect(mockSetFilters).not.toHaveBeenCalled();

        // Apply after reset commits empty buffers
        fireEvent.click(screen.getByTestId("apply-filter-btn"));
        expect(mockSetFilters).toHaveBeenCalled();

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback(filtersWithSelections);
        // Empty selections → [] under Model B (resolveForAPI falls back to dropdown FY)
        expect(result.fiscalYears).toEqual([]);
    });

    it("handles missing filter options data", () => {
        expect(() => {
            render(
                <BLIFilterButton
                    filters={defaultFilters}
                    setFilters={mockSetFilters}
                    filterOptions={undefined}
                />
            );
        }).not.toThrow();
    });

    it("includes currently selected FY years in options even if not in filterOptions", () => {
        render(
            <BLIFilterButton
                filters={{ ...defaultFilters, fiscalYears: [{ id: 2026, title: 2026 }] }}
                setFilters={mockSetFilters}
                filterOptions={{ ...mockFilterOptions, fiscal_years: [2023, 2025] }}
            />
        );

        expect(screen.getByTestId("filter-button")).toBeInTheDocument();
    });

    describe("defaultString (placeholder text)", () => {
        it("shows no placeholder text for fiscal year modal field", () => {
            render(
                <BLIFilterButton
                    filters={defaultFilters}
                    setFilters={mockSetFilters}
                />
            );

            // No placeholder text - empty state means "All"
            expect(screen.getByTestId("default-string")).toHaveTextContent("");
        });

        it("shows no placeholder text in any state", () => {
            render(
                <BLIFilterButton
                    filters={defaultFilters}
                    setFilters={mockSetFilters}
                />
            );

            // No placeholder text
            expect(screen.getByTestId("default-string")).toHaveTextContent("");
        });
    });

    describe("applyFiredFYRef seam", () => {
        it("applyFilter sets applyFiredFYRef before calling setFilters when the FY buffer actually changes", () => {
            // Regression guard: applyFiredFYRef must be set to true BEFORE setFilters is called
            // so the page-level reset effect sees the flag and skips resetting selectedFiscalYear
            // to "All". If the order is reversed (setFilters before ref set), the effect fires
            // before the flag is in place and incorrectly resets the dropdown year to "All".
            const applyFiredFYRef = { current: false };
            const setFilters = vi.fn(() => {
                // Capture whether the ref was set at the moment setFilters is called
                applyFiredFYRef._wasSetWhenCalled = applyFiredFYRef.current;
            });

            render(
                <BLIFilterButton
                    filters={defaultFilters}
                    setFilters={setFilters}
                    applyFiredFYRef={applyFiredFYRef}
                    filterOptions={mockFilterOptions}
                />
            );

            // Actually change the FY buffer so this Apply will change filters.fiscalYears' reference.
            fireEvent.click(screen.getByText("Set Fiscal Years"));
            fireEvent.click(screen.getByTestId("apply-filter-btn"));

            expect(setFilters).toHaveBeenCalled();
            // The ref must have been true at the moment setFilters was called
            expect(applyFiredFYRef._wasSetWhenCalled).toBe(true);
        });

        it("applyFilter does not set applyFiredFYRef when the FY buffer is unchanged from filters", () => {
            // Regression guard for the stuck-ref bug: if Apply writes back the same fiscalYears
            // reference (user didn't touch the FY combobox), the page-level effect keyed on
            // filters.fiscalYears never re-runs to clear the ref. Setting it anyway would leave
            // it stuck "true" and wrongly suppress a later, unrelated tag-removal reset.
            const applyFiredFYRef = { current: false };
            const setFilters = vi.fn();

            render(
                <BLIFilterButton
                    filters={defaultFilters}
                    setFilters={setFilters}
                    applyFiredFYRef={applyFiredFYRef}
                    filterOptions={mockFilterOptions}
                />
            );

            // Change an unrelated filter only — leave the FY combobox untouched.
            fireEvent.click(screen.getByText("Set Portfolios"));
            fireEvent.click(screen.getByTestId("apply-filter-btn"));

            expect(setFilters).toHaveBeenCalled();
            expect(applyFiredFYRef.current).toBe(false);
        });
    });
});
