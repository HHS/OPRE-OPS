import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PortfolioTable from "./PortfolioTable";
import { PORTFOLIO_SORT_CODES } from "./PortfolioTable.constants";

// Mock child components
vi.mock("./PortfolioTableHead", () => ({
    default: ({ fiscalYear, selectedHeader, sortDescending }) => (
        <thead data-testid="portfolio-table-head">
            <tr>
                <th>
                    FY {fiscalYear} - {selectedHeader} - {sortDescending ? "desc" : "asc"}
                </th>
            </tr>
        </thead>
    )
}));

vi.mock("./PortfolioTableRow", () => ({
    default: ({ portfolio }) => (
        <tr data-testid={`portfolio-row-${portfolio.id}`}>
            <td>{portfolio.name}</td>
        </tr>
    )
}));

describe("PortfolioTable", () => {
    const mockPortfolios = [
        {
            id: 1,
            name: "Child Care",
            abbreviation: "CC",
            division: {
                id: 1,
                name: "Division of Child and Family Development",
                abbreviation: "DCFD"
            },
            fundingSummary: {
                total_funding: { amount: 10000000 },
                available_funding: { amount: 5000000 },
                planned_funding: { amount: 2000000 },
                obligated_funding: { amount: 3000000 },
                in_execution_funding: { amount: 1000000 }
            }
        },
        {
            id: 2,
            name: "Child Welfare",
            abbreviation: "CW",
            division: {
                id: 2,
                name: "Division of Family Strengthening",
                abbreviation: "DFS"
            },
            fundingSummary: {
                total_funding: { amount: 5000000 },
                available_funding: { amount: 2500000 },
                planned_funding: { amount: 1000000 },
                obligated_funding: { amount: 1500000 },
                in_execution_funding: { amount: 500000 }
            }
        },
        {
            id: 3,
            name: "Office Director",
            abbreviation: "OD",
            division: {
                id: 4,
                name: "Office of the Director",
                abbreviation: "OD"
            },
            fundingSummary: {
                total_funding: { amount: 7500000 },
                available_funding: { amount: 3750000 },
                planned_funding: { amount: 1500000 },
                obligated_funding: { amount: 2250000 },
                in_execution_funding: { amount: 750000 }
            }
        }
    ];

    const defaultProps = {
        portfolios: mockPortfolios,
        fiscalYear: 2025,
        sortConditions: PORTFOLIO_SORT_CODES.DIVISION,
        sortDescending: false,
        setSortConditions: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithRouter = (component) => {
        return render(<MemoryRouter>{component}</MemoryRouter>);
    };

    it("renders table with portfolios", () => {
        renderWithRouter(<PortfolioTable {...defaultProps} />);

        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-table-head")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-row-1")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-row-2")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-row-3")).toBeInTheDocument();
    });

    it("displays all portfolio names", () => {
        renderWithRouter(<PortfolioTable {...defaultProps} />);

        expect(screen.getByText("Child Care")).toBeInTheDocument();
        expect(screen.getByText("Child Welfare")).toBeInTheDocument();
        expect(screen.getByText("Office Director")).toBeInTheDocument();
    });

    it("passes fiscal year to table head", () => {
        renderWithRouter(<PortfolioTable {...defaultProps} />);

        expect(screen.getByText(/FY 2025/)).toBeInTheDocument();
    });

    it("passes sort conditions to table head", () => {
        renderWithRouter(<PortfolioTable {...defaultProps} />);

        expect(screen.getByText(/DIVISION/)).toBeInTheDocument();
        expect(screen.getByText(/asc/)).toBeInTheDocument();
    });

    it("shows empty state when no portfolios", () => {
        const emptyProps = {
            ...defaultProps,
            portfolios: []
        };

        renderWithRouter(<PortfolioTable {...emptyProps} />);

        expect(screen.getByText("No portfolios found")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("sorts portfolios by division in ascending order", () => {
        renderWithRouter(<PortfolioTable {...defaultProps} />);

        const rows = screen.getAllByRole("row");
        // First row is header, so data rows start at index 1
        // DCFD (1) should come before DFS (2) which should come before OD (4)
        expect(rows[1]).toHaveTextContent("Child Care"); // DCFD
        expect(rows[2]).toHaveTextContent("Child Welfare"); // DFS
        expect(rows[3]).toHaveTextContent("Office Director"); // OD
    });

    it("sorts portfolios by division in descending order", () => {
        const descendingProps = {
            ...defaultProps,
            sortDescending: true
        };

        renderWithRouter(<PortfolioTable {...descendingProps} />);

        const rows = screen.getAllByRole("row");
        // Reversed order: OD (4) -> DFS (2) -> DCFD (1)
        expect(rows[1]).toHaveTextContent("Office Director"); // OD
        expect(rows[2]).toHaveTextContent("Child Welfare"); // DFS
        expect(rows[3]).toHaveTextContent("Child Care"); // DCFD
    });

    it("sorts portfolios by name", () => {
        const nameProps = {
            ...defaultProps,
            sortConditions: PORTFOLIO_SORT_CODES.PORTFOLIO_NAME
        };

        renderWithRouter(<PortfolioTable {...nameProps} />);

        const rows = screen.getAllByRole("row");
        // Alphabetical: Child Care, Child Welfare, Office Director
        expect(rows[1]).toHaveTextContent("Child Care");
        expect(rows[2]).toHaveTextContent("Child Welfare");
        expect(rows[3]).toHaveTextContent("Office Director");
    });

    it("sorts portfolios by FY budget", () => {
        const budgetProps = {
            ...defaultProps,
            sortConditions: PORTFOLIO_SORT_CODES.FY_BUDGET
        };

        renderWithRouter(<PortfolioTable {...budgetProps} />);

        const rows = screen.getAllByRole("row");
        // Budget order: CW (5M), OD (7.5M), CC (10M)
        expect(rows[1]).toHaveTextContent("Child Welfare");
        expect(rows[2]).toHaveTextContent("Office Director");
        expect(rows[3]).toHaveTextContent("Child Care");
    });

    it("sorts portfolios by FY available", () => {
        const availableProps = {
            ...defaultProps,
            sortConditions: PORTFOLIO_SORT_CODES.FY_AVAILABLE
        };

        renderWithRouter(<PortfolioTable {...availableProps} />);

        const rows = screen.getAllByRole("row");
        // Available order: CW (2.5M), OD (3.75M), CC (5M)
        expect(rows[1]).toHaveTextContent("Child Welfare");
        expect(rows[2]).toHaveTextContent("Office Director");
        expect(rows[3]).toHaveTextContent("Child Care");
    });

    it("handles portfolios with missing division data", () => {
        const portfoliosWithMissingDivision = [
            {
                ...mockPortfolios[0],
                division: null
            }
        ];

        const propsWithMissing = {
            ...defaultProps,
            portfolios: portfoliosWithMissingDivision
        };

        renderWithRouter(<PortfolioTable {...propsWithMissing} />);

        expect(screen.getByTestId("portfolio-row-1")).toBeInTheDocument();
        expect(screen.getByText("Child Care")).toBeInTheDocument();
    });

    it("handles portfolios with missing funding data", () => {
        const portfoliosWithMissingFunding = [
            {
                ...mockPortfolios[0],
                fundingSummary: null
            }
        ];

        const propsWithMissing = {
            ...defaultProps,
            portfolios: portfoliosWithMissingFunding
        };

        renderWithRouter(<PortfolioTable {...propsWithMissing} />);

        expect(screen.getByTestId("portfolio-row-1")).toBeInTheDocument();
        expect(screen.getByText("Child Care")).toBeInTheDocument();
    });

    it("renders single portfolio correctly", () => {
        const singleProps = {
            ...defaultProps,
            portfolios: [mockPortfolios[0]]
        };

        renderWithRouter(<PortfolioTable {...singleProps} />);

        expect(screen.getByTestId("portfolio-row-1")).toBeInTheDocument();
        expect(screen.getByText("Child Care")).toBeInTheDocument();
        expect(screen.queryByTestId("portfolio-row-2")).not.toBeInTheDocument();
    });

    it("applies correct CSS class", () => {
        renderWithRouter(<PortfolioTable {...defaultProps} />);

        const table = screen.getByRole("table");
        expect(table).toHaveClass("usa-table");
        expect(table).toHaveClass("usa-table--borderless");
        expect(table).toHaveClass("width-full");
    });
});
