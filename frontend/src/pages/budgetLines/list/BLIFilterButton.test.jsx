import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useGetBudgetLineItemsFilterOptionsQuery } from "../../../api/opsAPI";
import BLIFilterButton from "./BLIFilterButton";

vi.mock("../../../api/opsAPI");
vi.mock("react-router-dom", () => ({
    useSearchParams: () => [new URLSearchParams()]
}));

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
    default: ({ selectedFiscalYears, setSelectedFiscalYears }) => (
        <div data-testid="fiscal-year-combo">
            <button onClick={() => setSelectedFiscalYears([{ id: 2024, title: 2024 }])}>Set Fiscal Years</button>
            <button onClick={() => setSelectedFiscalYears([{ id: "ALL", title: "All Fiscal Years" }])}>
                Set All Fiscal Years
            </button>
            <div>{selectedFiscalYears?.length || 0} selected</div>
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
        useGetBudgetLineItemsFilterOptionsQuery.mockReturnValue({
            data: mockFilterOptions
        });
    });

    it("renders filter button component", () => {
        render(
            <BLIFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                selectedFiscalYear={2024}
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
                    selectedFiscalYear={2024}
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
                    selectedFiscalYear={2024}
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
                selectedFiscalYear={2024}
            />
        );

        const applyButton = screen.getByTestId("apply-filter-btn");
        fireEvent.click(applyButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });
    });

    it("sets fiscalYears to null when All Fiscal Years is selected", async () => {
        render(
            <BLIFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                selectedFiscalYear={2024}
            />
        );

        fireEvent.click(screen.getByText("Set All Fiscal Years"));
        fireEvent.click(screen.getByTestId("apply-filter-btn"));

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback(defaultFilters);
        expect(result.fiscalYears).toBeNull();
    });

    it("resets filters correctly", async () => {
        render(
            <BLIFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                selectedFiscalYear={2024}
            />
        );

        const resetButton = screen.getByTestId("reset-filter-btn");
        fireEvent.click(resetButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalledWith({
                fiscalYears: [],
                portfolios: [],
                bliStatus: [],
                budgetRange: null,
                agreementTypes: [],
                agreementTitles: [],
                canActivePeriods: []
            });
        });
    });

    it("handles missing filter options data", () => {
        useGetBudgetLineItemsFilterOptionsQuery.mockReturnValue({
            data: undefined
        });

        expect(() => {
            render(
                <BLIFilterButton
                    filters={defaultFilters}
                    setFilters={mockSetFilters}
                    selectedFiscalYear={2024}
                />
            );
        }).not.toThrow();
    });

    it("includes selectedFiscalYear in options when not in filterOptions", () => {
        useGetBudgetLineItemsFilterOptionsQuery.mockReturnValue({
            data: {
                ...mockFilterOptions,
                fiscal_years: [2023, 2025] // 2024 is not in the list
            }
        });

        render(
            <BLIFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                selectedFiscalYear={2024}
            />
        );

        expect(screen.getByTestId("filter-button")).toBeInTheDocument();
    });

    it("handles 'Multi' as selectedFiscalYear", () => {
        render(
            <BLIFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                selectedFiscalYear="Multi"
            />
        );

        expect(screen.getByTestId("filter-button")).toBeInTheDocument();
    });
});
