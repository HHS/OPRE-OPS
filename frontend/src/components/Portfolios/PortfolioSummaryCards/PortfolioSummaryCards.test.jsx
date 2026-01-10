import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PortfolioSummaryCards from "./PortfolioSummaryCards";

describe("PortfolioSummaryCards", () => {
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
                total_funding: {
                    amount: 7500000,
                    percent: 12
                }
            }
        },
        {
            id: 2,
            name: "Child Welfare",
            abbreviation: "CW",
            division: {
                id: 1,
                name: "Division of Child and Family Development",
                abbreviation: "DCFD"
            },
            fundingSummary: {
                total_funding: {
                    amount: 5000000,
                    percent: 8
                }
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
                total_funding: {
                    amount: 4125000,
                    percent: 6
                }
            }
        }
    ];

    const defaultProps = {
        fiscalYear: 2025,
        filteredPortfolios: mockPortfolios
    };

    it("renders with all required props", () => {
        render(<PortfolioSummaryCards {...defaultProps} />);

        expect(screen.getByText("FY 2025 Budget Across Portfolios")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-budget-summary-card")).toBeInTheDocument();
    });

    it("displays correct total budget amount", () => {
        render(<PortfolioSummaryCards {...defaultProps} />);

        // Total: 7,500,000 + 5,000,000 + 4,125,000 = 16,625,000
        const totalText = screen.getByText(/16,625,000/);
        expect(totalText).toBeInTheDocument();
    });

    it("renders horizontal stacked bar graph", () => {
        render(<PortfolioSummaryCards {...defaultProps} />);

        // HorizontalStackedBar component renders with button segments
        const segments = screen.getAllByRole("button");
        expect(segments.length).toBeGreaterThan(0);
    });

    it("renders portfolio legend with all portfolios", () => {
        render(<PortfolioSummaryCards {...defaultProps} />);

        expect(screen.getByTestId("portfolio-legend")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-legend-item-CC")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-legend-item-CW")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-legend-item-OD")).toBeInTheDocument();
    });

    it("displays correct fiscal year", () => {
        render(<PortfolioSummaryCards {...defaultProps} />);

        expect(screen.getByText("FY 2025 Budget Across Portfolios")).toBeInTheDocument();
    });

    it("handles empty portfolios array", () => {
        const emptyProps = {
            fiscalYear: 2025,
            filteredPortfolios: []
        };

        render(<PortfolioSummaryCards {...emptyProps} />);

        expect(screen.getByText("No budget data available for FY 2025")).toBeInTheDocument();
        expect(screen.getByText(/\$ 0/)).toBeInTheDocument();
    });

    it("handles null filteredPortfolios", () => {
        const nullProps = {
            fiscalYear: 2025,
            filteredPortfolios: null
        };

        render(<PortfolioSummaryCards {...nullProps} />);

        expect(screen.getByText("No budget data available for FY 2025")).toBeInTheDocument();
    });

    it("handles portfolios with zero total budget", () => {
        const zeroPortfolios = [
            {
                id: 1,
                name: "Test Portfolio",
                abbreviation: "TEST",
                fundingSummary: {
                    total_funding: {
                        amount: 0,
                        percent: 0
                    }
                }
            }
        ];

        const zeroProps = {
            fiscalYear: 2025,
            filteredPortfolios: zeroPortfolios
        };

        render(<PortfolioSummaryCards {...zeroProps} />);

        expect(screen.getByText("No budget data available for FY 2025")).toBeInTheDocument();
    });

    it("renders single portfolio correctly", () => {
        const singlePortfolio = [mockPortfolios[0]];

        const singleProps = {
            fiscalYear: 2025,
            filteredPortfolios: singlePortfolio
        };

        render(<PortfolioSummaryCards {...singleProps} />);

        expect(screen.getByText("FY 2025 Budget Across Portfolios")).toBeInTheDocument();
        expect(screen.getAllByText(/7,500,000/).length).toBeGreaterThan(0);
        expect(screen.getByTestId("portfolio-legend-item-CC")).toBeInTheDocument();
    });

    it("sorts portfolios by static order", () => {
        const unsortedPortfolios = [
            mockPortfolios[2], // OD (should be last)
            mockPortfolios[0], // CC (should be first)
            mockPortfolios[1] // CW (should be second)
        ];

        const unsortedProps = {
            fiscalYear: 2025,
            filteredPortfolios: unsortedPortfolios
        };

        render(<PortfolioSummaryCards {...unsortedProps} />);

        // Verify all portfolios are rendered (sorted order is tested in helpers tests)
        expect(screen.getByTestId("portfolio-legend-item-CC")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-legend-item-CW")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-legend-item-OD")).toBeInTheDocument();
    });

    it("handles portfolios with missing fundingSummary", () => {
        const portfoliosWithMissing = [
            mockPortfolios[0],
            {
                id: 99,
                name: "Incomplete Portfolio",
                abbreviation: "INC"
                // Missing fundingSummary
            }
        ];

        const propsWithMissing = {
            fiscalYear: 2025,
            filteredPortfolios: portfoliosWithMissing
        };

        render(<PortfolioSummaryCards {...propsWithMissing} />);

        // Should still render with valid portfolio
        expect(screen.getAllByText(/7,500,000/).length).toBeGreaterThan(0);
    });

    it("updates when fiscalYear changes", () => {
        const { rerender } = render(<PortfolioSummaryCards {...defaultProps} />);

        expect(screen.getByText("FY 2025 Budget Across Portfolios")).toBeInTheDocument();

        rerender(<PortfolioSummaryCards
            fiscalYear={2026}
            filteredPortfolios={mockPortfolios}
        />);

        expect(screen.getByText("FY 2026 Budget Across Portfolios")).toBeInTheDocument();
    });

    it("updates when filteredPortfolios changes", () => {
        const { rerender } = render(<PortfolioSummaryCards {...defaultProps} />);

        expect(screen.getAllByText(/16,625,000/).length).toBeGreaterThan(0);

        // Filter to just one portfolio
        rerender(<PortfolioSummaryCards
            fiscalYear={2025}
            filteredPortfolios={[mockPortfolios[0]]}
        />);

        expect(screen.getAllByText(/7,500,000/).length).toBeGreaterThan(0);
    });
});
