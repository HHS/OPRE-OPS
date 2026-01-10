import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PortfolioLegend from "./PortfolioLegend";

describe("PortfolioLegend", () => {
    const mockData = [
        {
            id: 1,
            label: "Child Care",
            abbreviation: "CC",
            value: 7500000,
            color: "var(--portfolio-budget-1)",
            percent: 45
        },
        {
            id: 2,
            label: "Child Welfare",
            abbreviation: "CW",
            value: 5000000,
            color: "var(--portfolio-budget-2)",
            percent: 30
        },
        {
            id: 3,
            label: "Office Director",
            abbreviation: "OD",
            value: 4125000,
            color: "var(--portfolio-budget-9)",
            percent: 25
        }
    ];

    const defaultProps = {
        data: mockData,
        activeId: 0
    };

    it("renders with all required props", () => {
        render(<PortfolioLegend {...defaultProps} />);

        expect(screen.getByTestId("portfolio-legend")).toBeInTheDocument();
    });

    it("renders correct number of legend items", () => {
        render(<PortfolioLegend {...defaultProps} />);

        expect(screen.getByTestId("portfolio-legend-item-CC")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-legend-item-CW")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-legend-item-OD")).toBeInTheDocument();
    });

    it("displays portfolio abbreviations", () => {
        render(<PortfolioLegend {...defaultProps} />);

        expect(screen.getByText("CC")).toBeInTheDocument();
        expect(screen.getByText("CW")).toBeInTheDocument();
        expect(screen.getByText("OD")).toBeInTheDocument();
    });

    it("displays formatted currency values", () => {
        render(<PortfolioLegend {...defaultProps} />);

        expect(screen.getByText("$7,500,000.00")).toBeInTheDocument();
        expect(screen.getByText("$5,000,000.00")).toBeInTheDocument();
        expect(screen.getByText("$4,125,000.00")).toBeInTheDocument();
    });

    it("displays percentage tags", () => {
        render(<PortfolioLegend {...defaultProps} />);

        expect(screen.getByText("45%")).toBeInTheDocument();
        expect(screen.getByText("30%")).toBeInTheDocument();
        expect(screen.getByText("25%")).toBeInTheDocument();
    });

    it("highlights active item", () => {
        const activeProps = {
            data: mockData,
            activeId: 1
        };

        render(<PortfolioLegend {...activeProps} />);

        const activeItem = screen.getByTestId("portfolio-legend-item-CC");
        // Check for the CSS module 'active' class
        expect(activeItem.className).toContain("active");
    });

    it("does not highlight non-active items", () => {
        const activeProps = {
            data: mockData,
            activeId: 1
        };

        render(<PortfolioLegend {...activeProps} />);

        const nonActiveItem = screen.getByTestId("portfolio-legend-item-CW");
        // Check that it doesn't have the CSS module 'active' class
        expect(nonActiveItem.className).not.toContain("active");
    });

    it("handles items with zero value", () => {
        const dataWithZero = [
            {
                id: 1,
                label: "Empty Portfolio",
                abbreviation: "EMPTY",
                value: 0,
                color: "var(--portfolio-budget-1)",
                percent: 0
            }
        ];

        render(
            <PortfolioLegend
                data={dataWithZero}
                activeId={0}
            />
        );

        expect(screen.getByText("$0")).toBeInTheDocument();
        expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("displays '<1%' for percentages less than 1", () => {
        const dataWithTiny = [
            {
                id: 1,
                label: "Tiny Portfolio",
                abbreviation: "TINY",
                value: 50000,
                color: "var(--portfolio-budget-1)",
                percent: 0.5
            }
        ];

        render(
            <PortfolioLegend
                data={dataWithTiny}
                activeId={0}
            />
        );

        expect(screen.getByText("<1%")).toBeInTheDocument();
    });

    it("displays normal percentage for exactly 1%", () => {
        const dataWithOne = [
            {
                id: 1,
                label: "One Percent",
                abbreviation: "ONE",
                value: 100000,
                color: "var(--portfolio-budget-1)",
                percent: 1
            }
        ];

        render(
            <PortfolioLegend
                data={dataWithOne}
                activeId={0}
            />
        );

        expect(screen.getByText("1%")).toBeInTheDocument();
    });

    it("renders null for empty data array", () => {
        render(
            <PortfolioLegend
                data={[]}
                activeId={0}
            />
        );

        expect(screen.queryByTestId("portfolio-legend")).not.toBeInTheDocument();
    });

    it("renders null for null data", () => {
        render(
            <PortfolioLegend
                data={null}
                activeId={0}
            />
        );

        expect(screen.queryByTestId("portfolio-legend")).not.toBeInTheDocument();
    });

    it("uses default activeId of 0 if not provided", () => {
        render(<PortfolioLegend data={mockData} />);

        expect(screen.getByTestId("portfolio-legend")).toBeInTheDocument();
    });

    it("renders color indicators with correct colors", () => {
        render(<PortfolioLegend {...defaultProps} />);

        const colorIndicators = screen.getAllByRole("img");

        expect(colorIndicators[0]).toHaveStyle({ color: "var(--portfolio-budget-1)" });
        expect(colorIndicators[1]).toHaveStyle({ color: "var(--portfolio-budget-2)" });
        expect(colorIndicators[2]).toHaveStyle({ color: "var(--portfolio-budget-9)" });
    });

    it("renders accessibility labels for color indicators", () => {
        render(<PortfolioLegend {...defaultProps} />);

        expect(screen.getByLabelText("CC indicator")).toBeInTheDocument();
        expect(screen.getByLabelText("CW indicator")).toBeInTheDocument();
        expect(screen.getByLabelText("OD indicator")).toBeInTheDocument();
    });

    it("handles large values correctly", () => {
        const largeData = [
            {
                id: 1,
                label: "Large Portfolio",
                abbreviation: "LARGE",
                value: 987654321.99,
                color: "var(--portfolio-budget-1)",
                percent: 100
            }
        ];

        render(
            <PortfolioLegend
                data={largeData}
                activeId={0}
            />
        );

        expect(screen.getByText("$987,654,321.99")).toBeInTheDocument();
    });

    it("formats decimal values with 2 decimal places", () => {
        const decimalData = [
            {
                id: 1,
                label: "Decimal Portfolio",
                abbreviation: "DEC",
                value: 1234567.891234,
                color: "var(--portfolio-budget-1)",
                percent: 50
            }
        ];

        render(
            <PortfolioLegend
                data={decimalData}
                activeId={0}
            />
        );

        expect(screen.getByText("$1,234,567.89")).toBeInTheDocument();
    });

    it("uses grid layout", () => {
        render(<PortfolioLegend {...defaultProps} />);

        const gridContainer = screen.getByTestId("portfolio-legend");
        expect(gridContainer).toBeInTheDocument();
    });
});
