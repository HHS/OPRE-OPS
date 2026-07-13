import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProjectFundingByPortfolioCard from "./ProjectFundingByPortfolioCard";

// Mock exposes setActiveId via a per-segment button so tests can drive the
// hover/active state the same way HorizontalStackedBar does on mouseenter.
vi.mock("../../UI/DataViz/HorizontalStackedBar/HorizontalStackedBar", () => ({
    default: ({ data, setActiveId }) => (
        <div data-testid="horizontal-stacked-bar">
            {data.map((d) => (
                <button
                    key={d.id}
                    data-testid={`activate-${d.abbreviation}`}
                    onClick={() => setActiveId(d.id)}
                >
                    {d.abbreviation}
                </button>
            ))}
        </div>
    )
}));

const mockFunding = [{ portfolio_id: 3, portfolio: "Child Care Research", amount: 500000, abbreviation: "CC" }];

describe("ProjectFundingByPortfolioCard", () => {
    it("renders the card heading with the selected fiscal year", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={mockFunding}
            />
        );
        expect(screen.getByText("FY 2025 Project Funding by Portfolio")).toBeInTheDocument();
    });

    it("renders the horizontal stacked bar when total > 0", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={mockFunding}
            />
        );
        expect(screen.getByTestId("horizontal-stacked-bar")).toBeInTheDocument();
    });

    it("does not render the stacked bar or legend when total is 0", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={[
                    { portfolio_id: 3, portfolio: "Child Care Research", amount: 0, abbreviation: "CC" }
                ]}
            />
        );
        expect(screen.queryByTestId("horizontal-stacked-bar")).not.toBeInTheDocument();
        expect(screen.queryByTestId("project-funding-portfolio-legend")).not.toBeInTheDocument();
    });

    it("renders the horizontal legend row with abbreviation, amount and percent", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={mockFunding}
            />
        );
        const legend = screen.getByTestId("project-funding-portfolio-legend");
        expect(legend).toBeInTheDocument();
        const legendItem = screen.getByTestId("portfolio-legend-item-CC");
        expect(legendItem).toBeInTheDocument();
        expect(legendItem).toHaveTextContent("CC");
        expect(legendItem).toHaveTextContent("100%");
    });

    it("renders one legend item per portfolio", () => {
        const multiFunding = [
            { portfolio_id: 3, portfolio: "Child Care Research", amount: 500000, abbreviation: "CC" },
            { portfolio_id: 2, portfolio: "Head Start Research", amount: 250000, abbreviation: "HS" }
        ];
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={multiFunding}
            />
        );
        expect(screen.getByTestId("portfolio-legend-item-CC")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-legend-item-HS")).toBeInTheDocument();
    });

    it("applies active styling to the percent tag when a segment is activated", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={mockFunding}
            />
        );
        const tag = within(screen.getByTestId("portfolio-legend-item-CC")).getByText("100%");
        // Before activation: default white background, no active color/fake-bold.
        expect(tag.className).not.toContain("fake-bold");
        expect(tag).not.toHaveStyle({ backgroundColor: "var(--portfolio-bar-graph-cc)" });

        fireEvent.click(screen.getByTestId("activate-CC"));

        // After activation: tag takes the portfolio color background and fake-bold.
        expect(tag.className).toContain("fake-bold");
        expect(tag).toHaveStyle({ backgroundColor: "var(--portfolio-bar-graph-cc)" });
    });

    it("active light-background portfolio (CC) uses dark text color (#1B1B1B) on the percent tag", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={mockFunding}
            />
        );
        fireEvent.click(screen.getByTestId("activate-CC"));
        const tag = within(screen.getByTestId("portfolio-legend-item-CC")).getByText("100%");
        expect(tag).toHaveStyle({ color: "#1B1B1B" });
    });

    it("active dark-background portfolio (CW) uses light text color (#FFFFFF) on the percent tag", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={[
                    { portfolio_id: 7, portfolio: "Child Welfare Research", amount: 500000, abbreviation: "CW" }
                ]}
            />
        );
        fireEvent.click(screen.getByTestId("activate-CW"));
        const tag = within(screen.getByTestId("portfolio-legend-item-CW")).getByText("100%");
        expect(tag).toHaveStyle({ color: "#FFFFFF" });
    });

    it("only the activated segment's tag receives active styling", () => {
        const multiFunding = [
            { portfolio_id: 3, portfolio: "Child Care Research", amount: 500000, abbreviation: "CC" },
            { portfolio_id: 2, portfolio: "Head Start Research", amount: 250000, abbreviation: "HS" }
        ];
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={multiFunding}
            />
        );
        fireEvent.click(screen.getByTestId("activate-CC"));

        const ccTag = within(screen.getByTestId("portfolio-legend-item-CC")).getByText(/%$/);
        const hsTag = within(screen.getByTestId("portfolio-legend-item-HS")).getByText(/%$/);
        expect(ccTag.className).toContain("fake-bold");
        expect(hsTag.className).not.toContain("fake-bold");
    });

    it("renders gracefully with empty funding data", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={[]}
            />
        );
        expect(screen.getByText("FY 2025 Project Funding by Portfolio")).toBeInTheDocument();
        expect(screen.queryByTestId("project-funding-portfolio-legend")).not.toBeInTheDocument();
    });
});
