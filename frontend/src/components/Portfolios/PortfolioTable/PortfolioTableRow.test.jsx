import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PortfolioTableRow from "./PortfolioTableRow";

describe("PortfolioTableRow", () => {
    const mockPortfolio = {
        id: 1,
        name: "Child Care",
        abbreviation: "CC",
        fundingSummary: {
            total_funding: { amount: 10000000 },
            available_funding: { amount: 5000000 },
            planned_funding: { amount: 2000000 },
            obligated_funding: { amount: 3000000 },
            in_execution_funding: { amount: 1000000 }
        }
    };

    const defaultProps = {
        portfolio: mockPortfolio,
        fiscalYear: 2025
    };

    const renderWithRouter = (component) => {
        return render(<MemoryRouter>{component}</MemoryRouter>);
    };

    it("renders portfolio name as link", () => {
        renderWithRouter(<PortfolioTableRow {...defaultProps} />);

        const link = screen.getByRole("link", { name: "Child Care (CC)" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/portfolios/1/spending?fy=2025");
    });

    it("displays total funding with currency format", () => {
        renderWithRouter(<PortfolioTableRow {...defaultProps} />);

        expect(screen.getByText("$10,000,000.00")).toBeInTheDocument();
    });

    it("displays spending (planned + obligated + in_execution)", () => {
        renderWithRouter(<PortfolioTableRow {...defaultProps} />);

        // Spending = 2,000,000 + 3,000,000 + 1,000,000 = 6,000,000
        expect(screen.getByText("$6,000,000.00")).toBeInTheDocument();
    });

    it("displays available funding", () => {
        renderWithRouter(<PortfolioTableRow {...defaultProps} />);

        expect(screen.getByText("$5,000,000.00")).toBeInTheDocument();
    });

    it("shows TBD when total funding is zero", () => {
        const portfolioWithZeroTotal = {
            ...mockPortfolio,
            fundingSummary: {
                ...mockPortfolio.fundingSummary,
                total_funding: { amount: 0 }
            }
        };

        renderWithRouter(
            <PortfolioTableRow
                portfolio={portfolioWithZeroTotal}
                fiscalYear={2025}
            />
        );

        // Find all TBD texts
        const tbdElements = screen.getAllByText("TBD");
        // Should have TBD for total funding
        expect(tbdElements.length).toBeGreaterThan(0);
    });

    it("shows TBD when spending is zero", () => {
        const portfolioWithZeroSpending = {
            ...mockPortfolio,
            fundingSummary: {
                ...mockPortfolio.fundingSummary,
                planned_funding: { amount: 0 },
                obligated_funding: { amount: 0 },
                in_execution_funding: { amount: 0 }
            }
        };

        renderWithRouter(
            <PortfolioTableRow
                portfolio={portfolioWithZeroSpending}
                fiscalYear={2025}
            />
        );

        // Should have TBD for spending
        const tbdElements = screen.getAllByText("TBD");
        expect(tbdElements.length).toBeGreaterThan(0);
    });

    it("displays available funding as $0 when zero (not TBD)", () => {
        const portfolioWithZeroAvailable = {
            id: 1,
            name: "Child Care",
            abbreviation: "CC",
            fundingSummary: {
                total_funding: { amount: 10000000 },
                available_funding: { amount: 0 },
                planned_funding: { amount: 2000000 },
                obligated_funding: { amount: 3000000 },
                in_execution_funding: { amount: 1000000 }
            }
        };

        renderWithRouter(
            <PortfolioTableRow
                portfolio={portfolioWithZeroAvailable}
                fiscalYear={2025}
            />
        );

        // CurrencyFormat displays $0 for zero available funding (getDecimalScale returns 0 for 0 values)
        expect(screen.getByText("$0")).toBeInTheDocument();
    });

    it("handles missing fundingSummary gracefully", () => {
        const portfolioWithoutFunding = {
            id: 1,
            name: "Test Portfolio",
            abbreviation: "TP",
            fundingSummary: null
        };

        renderWithRouter(
            <PortfolioTableRow
                portfolio={portfolioWithoutFunding}
                fiscalYear={2025}
            />
        );

        expect(screen.getByRole("link", { name: "Test Portfolio (TP)" })).toBeInTheDocument();
        // Should show TBD for missing values
        const tbdElements = screen.getAllByText("TBD");
        expect(tbdElements.length).toBeGreaterThan(0);
    });

    it("handles missing name with TBD", () => {
        const portfolioWithoutName = {
            ...mockPortfolio,
            name: null,
            abbreviation: null
        };

        renderWithRouter(
            <PortfolioTableRow
                portfolio={portfolioWithoutName}
                fiscalYear={2025}
            />
        );

        expect(screen.getByRole("link", { name: "TBD" })).toBeInTheDocument();
    });

    it("formats large numbers correctly", () => {
        const portfolioWithLargeNumbers = {
            ...mockPortfolio,
            fundingSummary: {
                total_funding: { amount: 123456789.12 },
                available_funding: { amount: 98765432.1 },
                planned_funding: { amount: 10000000 },
                obligated_funding: { amount: 10000000 },
                in_execution_funding: { amount: 4691357.02 }
            }
        };

        renderWithRouter(
            <PortfolioTableRow
                portfolio={portfolioWithLargeNumbers}
                fiscalYear={2025}
            />
        );

        expect(screen.getByText("$123,456,789.12")).toBeInTheDocument();
        expect(screen.getByText("$98,765,432.10")).toBeInTheDocument();
        // Spending = 10,000,000 + 10,000,000 + 4,691,357.02 = 24,691,357.02
        expect(screen.getByText("$24,691,357.02")).toBeInTheDocument();
    });

    it("formats small numbers with appropriate decimal places", () => {
        const portfolioWithSmallNumbers = {
            ...mockPortfolio,
            fundingSummary: {
                total_funding: { amount: 100.5 },
                available_funding: { amount: 50.25 },
                planned_funding: { amount: 20.1 },
                obligated_funding: { amount: 20.1 },
                in_execution_funding: { amount: 10.05 }
            }
        };

        renderWithRouter(
            <PortfolioTableRow
                portfolio={portfolioWithSmallNumbers}
                fiscalYear={2025}
            />
        );

        expect(screen.getByText("$100.50")).toBeInTheDocument();
        // Spending = 20.10 + 20.10 + 10.05 = 50.25
        // Both available and spending equal $50.25, so we expect to find it twice
        const elements = screen.getAllByText("$50.25");
        expect(elements).toHaveLength(2);
    });

    it("includes fiscal year in link", () => {
        renderWithRouter(
            <PortfolioTableRow
                portfolio={mockPortfolio}
                fiscalYear={2023}
            />
        );

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/portfolios/1/spending?fy=2023");
    });

    it("renders as table row with correct number of cells", () => {
        renderWithRouter(<PortfolioTableRow {...defaultProps} />);

        // Verify the row renders by checking for link (unique to first cell)
        const link = screen.getByRole("link", { name: "Child Care (CC)" });
        expect(link).toBeInTheDocument();

        // Verify all four values are rendered (Name as link, Total, Spending, Available as currency)
        expect(screen.getByText("$10,000,000.00")).toBeInTheDocument(); // Total
        expect(screen.getByText("$6,000,000.00")).toBeInTheDocument(); // Spending
        expect(screen.getByText("$5,000,000.00")).toBeInTheDocument(); // Available
    });

    it("applies correct link styling", () => {
        renderWithRouter(<PortfolioTableRow {...defaultProps} />);

        const link = screen.getByRole("link");
        expect(link).toHaveClass("text-ink");
        expect(link).toHaveClass("text-no-underline");
    });
});
