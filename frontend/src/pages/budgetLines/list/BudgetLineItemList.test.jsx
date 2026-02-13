import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
    useGetBudgetLineItemsQuery,
    useLazyGetBudgetLineItemsQuery,
    useLazyGetPortfolioByIdQuery,
    useLazyGetServicesComponentByIdQuery
} from "../../../api/opsAPI";
import BudgetLineItemList from "./BudgetLineItemList";
import * as hooks from "./BudgetLinesItems.hooks";

const mockStore = configureStore([]);

vi.mock("../../../api/opsAPI");
vi.mock("./BudgetLinesItems.hooks");
vi.mock("../../../components/UI/Table/Table.hooks", () => ({
    useSetSortConditions: vi.fn(() => ({
        sortDescending: false,
        sortCondition: "id",
        setSortConditions: vi.fn()
    }))
}));
vi.mock("../../../helpers/budgetLines.helpers", () => ({
    handleExport: vi.fn()
}));
vi.mock("../../../helpers/tableExport.helpers.js", () => ({
    exportTableToXlsx: vi.fn()
}));
vi.mock("../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getCurrentFiscalYear: vi.fn(() => 2024)
    };
});

// Mock the App component to avoid router complexity
vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-mock">{children}</div>
}));

// Mock react-router-dom
vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
        useNavigate: vi.fn(() => vi.fn())
    };
});
vi.mock("../../../components/BudgetLineItems/AllBudgetLinesTable", () => ({
    default: () => <div data-testid="all-budget-lines-table">Budget Lines Table</div>
}));
vi.mock("../../../components/BudgetLineItems/SummaryCardsSection", () => ({
    default: () => <div data-testid="summary-cards-section">Summary Cards</div>
}));
vi.mock("./BLIFilterButton", () => ({
    default: () => <div data-testid="bli-filter-button">Filter Button</div>
}));
vi.mock("./BLIFilterTags", () => ({
    default: () => <div data-testid="bli-filter-tags">Filter Tags</div>
}));
vi.mock("./BLITabs", () => ({
    default: () => <div data-testid="bli-tabs">BLI Tabs</div>
}));
vi.mock("../../../components/UI/FiscalYear", () => ({
    default: () => <div data-testid="fiscal-year">Fiscal Year</div>
}));
vi.mock("../../../components/Layouts/TablePageLayout", () => ({
    default: ({ title, subtitle, TableSection, FilterButton, SummaryCardsSection }) => (
        <div data-testid="table-page-layout">
            <h1>{title}</h1>
            <h2>{subtitle}</h2>
            <div data-testid="table-section">{TableSection}</div>
            <div data-testid="filter-button-section">{FilterButton}</div>
            <div data-testid="summary-cards">{SummaryCardsSection}</div>
        </div>
    )
}));

const mockBudgetLineItems = [
    {
        id: 1,
        line_description: "Test BLI 1",
        amount: 100000,
        fiscal_year: 2024,
        status: "PLANNED",
        _meta: {
            total_amount: 500000,
            total_draft_amount: 100000,
            total_planned_amount: 200000,
            total_in_execution_amount: 150000,
            total_obligated_amount: 50000
        }
    },
    {
        id: 2,
        line_description: "Test BLI 2",
        amount: 200000,
        fiscal_year: 2024,
        status: "EXECUTING",
        _meta: {
            total_amount: 500000,
            total_draft_amount: 100000,
            total_planned_amount: 200000,
            total_in_execution_amount: 150000,
            total_obligated_amount: 50000
        }
    }
];

describe("BudgetLineItemList", () => {
    const initialState = {
        auth: {
            activeUser: {
                id: 1,
                name: "Test User"
            }
        },
        alert: {
            isActive: false
        }
    };
    const store = mockStore(initialState);

    const defaultFilters = {
        fiscalYears: [],
        portfolios: [],
        bliStatus: [],
        budgetRange: null,
        agreementTypes: [],
        agreementTitles: [],
        canActivePeriods: []
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock lazy query hooks
        useLazyGetBudgetLineItemsQuery.mockReturnValue([vi.fn(), { isLoading: false }]);
        useLazyGetPortfolioByIdQuery.mockReturnValue([vi.fn(), { isLoading: false }]);
        useLazyGetServicesComponentByIdQuery.mockReturnValue([vi.fn(), { isLoading: false }]);

        // Default mock for useBudgetLinesList hook
        vi.spyOn(hooks, "useBudgetLinesList").mockReturnValue({
            myBudgetLineItemsUrl: false,
            filters: defaultFilters,
            setFilters: vi.fn()
        });
    });

    it("renders loading state", () => {
        useGetBudgetLineItemsQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetBudgetLineItemsQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        expect(screen.getByText("Oops, an error occurred")).toBeInTheDocument();
    });

    it("renders budget line items successfully", () => {
        useGetBudgetLineItemsQuery.mockReturnValue({
            data: mockBudgetLineItems,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        expect(screen.getByText("Budget Lines")).toBeInTheDocument();
        expect(screen.getByTestId("all-budget-lines-table")).toBeInTheDocument();
        expect(screen.getByTestId("summary-cards-section")).toBeInTheDocument();
    });

    it("handles null fiscalYears filter gracefully", () => {
        vi.spyOn(hooks, "useBudgetLinesList").mockReturnValue({
            myBudgetLineItemsUrl: false,
            filters: {
                ...defaultFilters,
                fiscalYears: null
            },
            setFilters: vi.fn()
        });

        useGetBudgetLineItemsQuery.mockReturnValue({
            data: mockBudgetLineItems,
            isLoading: false,
            isError: false
        });

        expect(() => {
            render(
                <Provider store={store}>
                    <BudgetLineItemList />
                </Provider>
            );
        }).not.toThrow();

        expect(screen.getByText("Budget Lines")).toBeInTheDocument();
    });

    it("does not replace fiscalYears with selectedFiscalYear when fiscalYears is null", () => {
        vi.spyOn(hooks, "useBudgetLinesList").mockReturnValue({
            myBudgetLineItemsUrl: false,
            filters: {
                ...defaultFilters,
                fiscalYears: null
            },
            setFilters: vi.fn()
        });

        useGetBudgetLineItemsQuery.mockReturnValue({
            data: mockBudgetLineItems,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        expect(useGetBudgetLineItemsQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                filters: expect.objectContaining({
                    fiscalYears: null
                })
            })
        );
    });

    it("handles undefined fiscalYears filter gracefully", () => {
        vi.spyOn(hooks, "useBudgetLinesList").mockReturnValue({
            myBudgetLineItemsUrl: false,
            filters: {
                ...defaultFilters,
                fiscalYears: undefined
            },
            setFilters: vi.fn()
        });

        useGetBudgetLineItemsQuery.mockReturnValue({
            data: mockBudgetLineItems,
            isLoading: false,
            isError: false
        });

        expect(() => {
            render(
                <Provider store={store}>
                    <BudgetLineItemList />
                </Provider>
            );
        }).not.toThrow();

        expect(screen.getByText("Budget Lines")).toBeInTheDocument();
    });

    it("uses current fiscal year when fiscalYears is undefined", () => {
        vi.spyOn(hooks, "useBudgetLinesList").mockReturnValue({
            myBudgetLineItemsUrl: false,
            filters: {
                ...defaultFilters,
                fiscalYears: undefined
            },
            setFilters: vi.fn()
        });

        useGetBudgetLineItemsQuery.mockReturnValue({
            data: mockBudgetLineItems,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        expect(useGetBudgetLineItemsQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                filters: expect.objectContaining({
                    fiscalYears: [{ id: 2024, title: 2024 }]
                })
            })
        );
    });

    it("does not render summary cards when no budget line items", () => {
        useGetBudgetLineItemsQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        expect(screen.queryByTestId("summary-cards-section")).not.toBeInTheDocument();
    });

    it("does not render export button when no budget line items", () => {
        useGetBudgetLineItemsQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        expect(screen.queryByText("Export")).not.toBeInTheDocument();
    });

    it("renders export button when budget line items exist", () => {
        useGetBudgetLineItemsQuery.mockReturnValue({
            data: mockBudgetLineItems,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        expect(screen.getByText("Export")).toBeInTheDocument();
    });

    it("displays 'My Budget Lines' subtitle when myBudgetLineItemsUrl is true", () => {
        vi.spyOn(hooks, "useBudgetLinesList").mockReturnValue({
            myBudgetLineItemsUrl: true,
            filters: defaultFilters,
            setFilters: vi.fn()
        });

        useGetBudgetLineItemsQuery.mockReturnValue({
            data: mockBudgetLineItems,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        expect(screen.getByText("My Budget Lines")).toBeInTheDocument();
    });

    it("displays 'All Budget Lines' subtitle when myBudgetLineItemsUrl is false", () => {
        vi.spyOn(hooks, "useBudgetLinesList").mockReturnValue({
            myBudgetLineItemsUrl: false,
            filters: defaultFilters,
            setFilters: vi.fn()
        });

        useGetBudgetLineItemsQuery.mockReturnValue({
            data: mockBudgetLineItems,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        expect(screen.getByText("All Budget Lines")).toBeInTheDocument();
    });

    it("handles null budgetLineItems data gracefully", () => {
        useGetBudgetLineItemsQuery.mockReturnValue({
            data: null,
            isLoading: false,
            isError: false
        });

        expect(() => {
            render(
                <Provider store={store}>
                    <BudgetLineItemList />
                </Provider>
            );
        }).not.toThrow();

        expect(screen.getByText("Budget Lines")).toBeInTheDocument();
    });

    it("calls handleExport with resolved fiscal year when filters.fiscalYears is empty", async () => {
        const { handleExport } = await import("../../../helpers/budgetLines.helpers");

        vi.spyOn(hooks, "useBudgetLinesList").mockReturnValue({
            myBudgetLineItemsUrl: false,
            filters: {
                ...defaultFilters,
                fiscalYears: [] // Empty array should resolve to current FY
            },
            setFilters: vi.fn()
        });

        useGetBudgetLineItemsQuery.mockReturnValue({
            data: mockBudgetLineItems,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        const exportButton = screen.getByText("Export");
        exportButton.click();

        expect(handleExport).toHaveBeenCalledWith(
            expect.any(Function), // exportTableToXlsx
            expect.any(Function), // setIsExporting
            expect.objectContaining({
                fiscalYears: [{ id: 2024, title: 2024 }], // Should be resolved to current FY
                budgetLineTotalMin: undefined,
                budgetLineTotalMax: undefined
            }),
            mockBudgetLineItems,
            expect.any(Function), // budgetLineTrigger
            expect.any(Function), // serviceComponentTrigger
            expect.any(Function) // portfolioTrigger
        );
    });

    it("calls handleExport with empty fiscalYears when selectedFiscalYear is Multi", async () => {
        const { handleExport } = await import("../../../helpers/budgetLines.helpers");

        vi.spyOn(hooks, "useBudgetLinesList").mockReturnValue({
            myBudgetLineItemsUrl: false,
            filters: {
                ...defaultFilters,
                fiscalYears: [] // Empty array with Multi should remain empty
            },
            setFilters: vi.fn()
        });

        useGetBudgetLineItemsQuery.mockReturnValue({
            data: mockBudgetLineItems,
            isLoading: false,
            isError: false
        });

        const { rerender } = render(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        // Simulate setting selectedFiscalYear to "Multi" by providing filters with multiple years
        vi.spyOn(hooks, "useBudgetLinesList").mockReturnValue({
            myBudgetLineItemsUrl: false,
            filters: {
                ...defaultFilters,
                fiscalYears: [
                    { id: 2023, title: 2023 },
                    { id: 2024, title: 2024 }
                ]
            },
            setFilters: vi.fn()
        });

        rerender(
            <Provider store={store}>
                <BudgetLineItemList />
            </Provider>
        );

        const exportButton = screen.getByText("Export");
        exportButton.click();

        expect(handleExport).toHaveBeenCalledWith(
            expect.any(Function),
            expect.any(Function),
            expect.objectContaining({
                fiscalYears: [
                    { id: 2023, title: 2023 },
                    { id: 2024, title: 2024 }
                ] // Should keep the array as-is
            }),
            mockBudgetLineItems,
            expect.any(Function),
            expect.any(Function),
            expect.any(Function)
        );
    });
});
