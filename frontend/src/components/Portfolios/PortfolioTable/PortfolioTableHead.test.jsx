import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PortfolioTableHead from "./PortfolioTableHead";
import { PORTFOLIO_SORT_CODES } from "./PortfolioTable.constants";

describe("PortfolioTableHead", () => {
    const defaultProps = {
        onClickHeader: vi.fn(),
        selectedHeader: PORTFOLIO_SORT_CODES.DIVISION,
        sortDescending: false,
        fiscalYear: 2025
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders all column headers", () => {
        render(
            <table>
                <PortfolioTableHead {...defaultProps} />
            </table>
        );

        expect(screen.getByRole("columnheader", { name: /Portfolio/i })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /FY 25 Budget/i })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /FY 25 Spending/i })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /FY 25 Available/i })).toBeInTheDocument();
    });

    it("displays correct fiscal year in headers", () => {
        render(
            <table>
                <PortfolioTableHead {...defaultProps} fiscalYear={2026} />
            </table>
        );

        expect(screen.getByText(/FY 26 Budget/i)).toBeInTheDocument();
        expect(screen.getByText(/FY 26 Spending/i)).toBeInTheDocument();
        expect(screen.getByText(/FY 26 Available/i)).toBeInTheDocument();
    });

    it("calls onClickHeader when Portfolio column is clicked", () => {
        render(
            <table>
                <PortfolioTableHead {...defaultProps} />
            </table>
        );

        const portfolioButton = screen.getByRole("button", { name: /Portfolio/i });
        fireEvent.click(portfolioButton);

        expect(defaultProps.onClickHeader).toHaveBeenCalledWith(PORTFOLIO_SORT_CODES.PORTFOLIO_NAME, true);
    });

    it("calls onClickHeader when Budget column is clicked", () => {
        render(
            <table>
                <PortfolioTableHead {...defaultProps} />
            </table>
        );

        const budgetButton = screen.getByRole("button", { name: /FY 25 Budget/i });
        fireEvent.click(budgetButton);

        expect(defaultProps.onClickHeader).toHaveBeenCalledWith(PORTFOLIO_SORT_CODES.FY_BUDGET, true);
    });

    it("calls onClickHeader when Spending column is clicked", () => {
        render(
            <table>
                <PortfolioTableHead {...defaultProps} />
            </table>
        );

        const spendingButton = screen.getByRole("button", { name: /FY 25 Spending/i });
        fireEvent.click(spendingButton);

        expect(defaultProps.onClickHeader).toHaveBeenCalledWith(PORTFOLIO_SORT_CODES.FY_SPENDING, true);
    });

    it("calls onClickHeader when Available column is clicked", () => {
        render(
            <table>
                <PortfolioTableHead {...defaultProps} />
            </table>
        );

        const availableButton = screen.getByRole("button", { name: /FY 25 Available/i });
        fireEvent.click(availableButton);

        expect(defaultProps.onClickHeader).toHaveBeenCalledWith(PORTFOLIO_SORT_CODES.FY_AVAILABLE, true);
    });

    it("toggles sort direction when same header is clicked", () => {
        const props = {
            ...defaultProps,
            selectedHeader: PORTFOLIO_SORT_CODES.PORTFOLIO_NAME,
            sortDescending: false
        };

        render(
            <table>
                <PortfolioTableHead {...props} />
            </table>
        );

        const portfolioButton = screen.getByRole("button", { name: /Portfolio/i });
        fireEvent.click(portfolioButton);

        // Should toggle sortDescending to true
        expect(props.onClickHeader).toHaveBeenCalledWith(PORTFOLIO_SORT_CODES.PORTFOLIO_NAME, true);
    });

    it("shows ascending arrow when column is sorted ascending", () => {
        const props = {
            ...defaultProps,
            selectedHeader: PORTFOLIO_SORT_CODES.PORTFOLIO_NAME,
            sortDescending: false
        };

        render(
            <table>
                <PortfolioTableHead {...props} />
            </table>
        );

        // Verify ascending sort is indicated in aria-sort
        const portfolioHeader = screen.getByRole("columnheader", { name: /Portfolio/i });
        expect(portfolioHeader).toHaveAttribute("aria-sort", "ascending");
    });

    it("shows descending arrow when column is sorted descending", () => {
        const props = {
            ...defaultProps,
            selectedHeader: PORTFOLIO_SORT_CODES.PORTFOLIO_NAME,
            sortDescending: true
        };

        render(
            <table>
                <PortfolioTableHead {...props} />
            </table>
        );

        // Verify descending sort is indicated in aria-sort
        const portfolioHeader = screen.getByRole("columnheader", { name: /Portfolio/i });
        expect(portfolioHeader).toHaveAttribute("aria-sort", "descending");
    });

    it("does not show sort arrow for unselected columns", () => {
        const props = {
            ...defaultProps,
            selectedHeader: PORTFOLIO_SORT_CODES.PORTFOLIO_NAME,
            sortDescending: false
        };

        render(
            <table>
                <PortfolioTableHead {...props} />
            </table>
        );

        // Verify unselected columns have aria-sort="none"
        const budgetHeader = screen.getByRole("columnheader", { name: /FY 25 Budget/i });
        expect(budgetHeader).toHaveAttribute("aria-sort", "none");
    });

    it("sets correct aria-sort for ascending sort", () => {
        const props = {
            ...defaultProps,
            selectedHeader: PORTFOLIO_SORT_CODES.FY_BUDGET,
            sortDescending: false
        };

        render(
            <table>
                <PortfolioTableHead {...props} />
            </table>
        );

        const budgetHeader = screen.getByRole("columnheader", { name: /FY 25 Budget/i });
        expect(budgetHeader).toHaveAttribute("aria-sort", "ascending");
    });

    it("sets correct aria-sort for descending sort", () => {
        const props = {
            ...defaultProps,
            selectedHeader: PORTFOLIO_SORT_CODES.FY_BUDGET,
            sortDescending: true
        };

        render(
            <table>
                <PortfolioTableHead {...props} />
            </table>
        );

        const budgetHeader = screen.getByRole("columnheader", { name: /FY 25 Budget/i });
        expect(budgetHeader).toHaveAttribute("aria-sort", "descending");
    });

    it("sets aria-sort to none for unselected columns", () => {
        const props = {
            ...defaultProps,
            selectedHeader: PORTFOLIO_SORT_CODES.FY_BUDGET,
            sortDescending: false
        };

        render(
            <table>
                <PortfolioTableHead {...props} />
            </table>
        );

        const portfolioHeader = screen.getByRole("columnheader", { name: /Portfolio/i });
        expect(portfolioHeader).toHaveAttribute("aria-sort", "none");
    });

    it("includes helpful title attributes on header buttons", () => {
        render(
            <table>
                <PortfolioTableHead {...defaultProps} />
            </table>
        );

        const portfolioButton = screen.getByRole("button", { name: /Portfolio/i });
        expect(portfolioButton).toHaveAttribute("title");
        expect(portfolioButton.getAttribute("title")).toContain("sort");
    });

    it("handles missing fiscalYear gracefully", () => {
        const props = {
            ...defaultProps,
            fiscalYear: null
        };

        render(
            <table>
                <PortfolioTableHead {...props} />
            </table>
        );

        // Should still render, just without FY prefix - check for the button text
        expect(screen.getByText(/^FY\s+Budget$/i)).toBeInTheDocument();
    });

    it("handles missing onClickHeader gracefully", () => {
        const props = {
            ...defaultProps,
            onClickHeader: undefined
        };

        render(
            <table>
                <PortfolioTableHead {...props} />
            </table>
        );

        const portfolioButton = screen.getByRole("button", { name: /Portfolio/i });

        // Should not throw error when clicked
        expect(() => {
            fireEvent.click(portfolioButton);
        }).not.toThrow();
    });

    it("applies correct CSS classes to header buttons", () => {
        render(
            <table>
                <PortfolioTableHead {...defaultProps} />
            </table>
        );

        const buttons = screen.getAllByRole("button");
        buttons.forEach((button) => {
            expect(button).toHaveClass("usa-table__header__button");
            expect(button).toHaveClass("cursor-pointer");
        });
    });

    it("applies whitespace nowrap style to headers", () => {
        render(
            <table>
                <PortfolioTableHead {...defaultProps} />
            </table>
        );

        const headers = screen.getAllByRole("columnheader");
        headers.forEach((header) => {
            expect(header).toHaveStyle({ whiteSpace: "nowrap" });
        });
    });
});
