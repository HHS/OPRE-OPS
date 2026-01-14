import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import PortfolioList from "./PortfolioList";
import * as portfolioListHooks from "./PortfolioList.hooks";
import { DEFAULT_PORTFOLIO_BUDGET_RANGE } from "../../../constants";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams()]
    };
});

// Mock the hooks
vi.mock("./PortfolioList.hooks", () => ({
    usePortfolioList: vi.fn()
}));

// Mock App component to avoid router issues
vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-wrapper">{children}</div>
}));

// Mock child components to simplify testing
vi.mock("../../../components/Portfolios/PortfolioTable", () => ({
    default: ({ portfolios }) => (
        <div data-testid="portfolio-table">
            {portfolios.map((p) => (
                <div key={p.id}>{p.name}</div>
            ))}
        </div>
    )
}));

vi.mock("../../../components/Portfolios/PortfolioSummaryCards", () => ({
    default: () => <div data-testid="portfolio-summary-cards">Summary Cards</div>
}));

vi.mock("./PortfolioFiscalYearSelect", () => ({
    default: () => <div data-testid="fiscal-year-select">FY Select</div>
}));

vi.mock("./PortfolioTabs", () => ({
    default: ({ activeTab }) => <div data-testid="portfolio-tabs">{activeTab}</div>
}));

vi.mock("./PortfolioFilterButton", () => ({
    default: () => <button data-testid="filter-button">Filter</button>
}));

vi.mock("./PortfolioFilterTags", () => ({
    default: () => <div data-testid="filter-tags">Filter Tags</div>
}));

vi.mock("../../../helpers/tableExport.helpers", () => ({
    exportTableToXlsx: vi.fn()
}));

describe("PortfolioList", () => {
    let mockStore;

    const mockPortfolios = [
        {
            id: 1,
            name: "Child Care",
            abbreviation: "CC",
            fundingSummary: {
                total_funding: { amount: 10000000 }
            }
        },
        {
            id: 2,
            name: "Child Welfare",
            abbreviation: "CW",
            fundingSummary: {
                total_funding: { amount: 5000000 }
            }
        }
    ];

    const mockHookReturn = {
        setSelectedFiscalYear: vi.fn(),
        activeTab: "all",
        setActiveTab: vi.fn(),
        filters: {
            portfolios: [],
            budgetRange: DEFAULT_PORTFOLIO_BUDGET_RANGE,
            availablePct: []
        },
        setFilters: vi.fn(),
        fiscalYear: 2025,
        allPortfolios: mockPortfolios,
        portfoliosWithFunding: mockPortfolios,
        filteredPortfolios: mockPortfolios,
        fyBudgetRange: DEFAULT_PORTFOLIO_BUDGET_RANGE,
        isLoading: false,
        isError: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();

        mockStore = configureStore({
            reducer: {
                userSlice: () => ({
                    activeUser: { id: 1, email: "test@example.com" }
                }),
                alert: () => ({
                    isActive: false,
                    type: "",
                    heading: "",
                    message: "",
                    redirectUrl: ""
                })
            }
        });

        portfolioListHooks.usePortfolioList.mockReturnValue(mockHookReturn);
    });

    const renderWithProviders = (component) => {
        return render(
            <Provider store={mockStore}>
                <MemoryRouter>{component}</MemoryRouter>
            </Provider>
        );
    };

    it("renders loading state when data is loading", () => {
        portfolioListHooks.usePortfolioList.mockReturnValue({
            ...mockHookReturn,
            isLoading: true
        });

        renderWithProviders(<PortfolioList />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders main page structure when loaded", () => {
        renderWithProviders(<PortfolioList />);

        expect(screen.getByText("Portfolios")).toBeInTheDocument();
        expect(screen.getByText("All Portfolios")).toBeInTheDocument();
        expect(screen.getByTestId("fiscal-year-select")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-tabs")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-table")).toBeInTheDocument();
    });

    it("displays correct subtitle for 'all' tab", () => {
        renderWithProviders(<PortfolioList />);

        expect(screen.getByText("All Portfolios")).toBeInTheDocument();
        expect(
            screen.getByText(
                "This is a list of all portfolios across OPRE with their budget and spending data for the selected fiscal year."
            )
        ).toBeInTheDocument();
    });

    it("displays correct subtitle for 'my' tab", () => {
        portfolioListHooks.usePortfolioList.mockReturnValue({
            ...mockHookReturn,
            activeTab: "my"
        });

        renderWithProviders(<PortfolioList />);

        expect(screen.getByText("My Portfolios")).toBeInTheDocument();
        expect(screen.getByText("This is a list of portfolios where you are a team leader.")).toBeInTheDocument();
    });

    it("displays summary cards on 'all' tab", () => {
        renderWithProviders(<PortfolioList />);

        expect(screen.getByTestId("portfolio-summary-cards")).toBeInTheDocument();
    });

    it("does not display summary cards on 'my' tab", () => {
        portfolioListHooks.usePortfolioList.mockReturnValue({
            ...mockHookReturn,
            activeTab: "my"
        });

        renderWithProviders(<PortfolioList />);

        expect(screen.queryByTestId("portfolio-summary-cards")).not.toBeInTheDocument();
    });

    it("renders export button when portfolios exist", () => {
        renderWithProviders(<PortfolioList />);

        expect(screen.getByText("Export")).toBeInTheDocument();
        const exportButton = screen.getByRole("button", { name: /export/i });
        expect(exportButton).toHaveAttribute("data-cy", "portfolio-export");
    });

    it("does not render export button when no portfolios", () => {
        portfolioListHooks.usePortfolioList.mockReturnValue({
            ...mockHookReturn,
            portfoliosWithFunding: []
        });

        renderWithProviders(<PortfolioList />);

        expect(screen.queryByText("Export")).not.toBeInTheDocument();
    });

    it("renders filter button", () => {
        renderWithProviders(<PortfolioList />);

        expect(screen.getByTestId("filter-button")).toBeInTheDocument();
    });

    it("renders filter tags", () => {
        renderWithProviders(<PortfolioList />);

        expect(screen.getByTestId("filter-tags")).toBeInTheDocument();
    });

    it("passes correct portfolios to table", () => {
        renderWithProviders(<PortfolioList />);

        const table = screen.getByTestId("portfolio-table");
        expect(table).toBeInTheDocument();
        expect(screen.getByText("Child Care")).toBeInTheDocument();
        expect(screen.getByText("Child Welfare")).toBeInTheDocument();
    });

    it("navigates to error page on error", async () => {
        portfolioListHooks.usePortfolioList.mockReturnValue({
            ...mockHookReturn,
            isError: true,
            isLoading: false
        });

        renderWithProviders(<PortfolioList />);

        // Should navigate to error page when isError is true
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });

    it("handles empty filtered portfolios", () => {
        portfolioListHooks.usePortfolioList.mockReturnValue({
            ...mockHookReturn,
            filteredPortfolios: []
        });

        renderWithProviders(<PortfolioList />);

        expect(screen.getByTestId("portfolio-table")).toBeInTheDocument();
        expect(screen.queryByText("Child Care")).not.toBeInTheDocument();
    });
});
