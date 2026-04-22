import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProjectFundingByPortfolioCard from "./ProjectFundingByPortfolioCard";

vi.mock("../../UI/DataViz/HorizontalStackedBar/HorizontalStackedBar", () => ({
    default: ({ data }) => (
        <div data-testid="horizontal-stacked-bar">
            {data.map((d) => (
                <span key={d.id}>{d.abbreviation}</span>
            ))}
        </div>
    )
}));

vi.mock("../../Portfolios/PortfolioSummaryCards/PortfolioLegend", () => ({
    default: ({ data }) => (
        <div data-testid="portfolio-legend">
            {data.map((d) => (
                <span key={d.id}>{d.abbreviation}</span>
            ))}
        </div>
    )
}));

const mockFunding = [{ portfolio_id: 3, portfolio: "Child Care Research", amount: 500000 }];

const mockAbbrevMap = new Map([[3, "CC"]]);

describe("ProjectFundingByPortfolioCard", () => {
    it("renders the card heading with the selected fiscal year", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={mockFunding}
                portfolioAbbrevMap={mockAbbrevMap}
            />
        );
        expect(screen.getByText("FY 2025 Project Funding by Portfolio")).toBeInTheDocument();
    });

    it("renders the horizontal stacked bar when total > 0", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={mockFunding}
                portfolioAbbrevMap={mockAbbrevMap}
            />
        );
        expect(screen.getByTestId("horizontal-stacked-bar")).toBeInTheDocument();
    });

    it("does not render the stacked bar when total is 0", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={[{ portfolio_id: 3, portfolio: "Child Care Research", amount: 0 }]}
                portfolioAbbrevMap={mockAbbrevMap}
            />
        );
        expect(screen.queryByTestId("horizontal-stacked-bar")).not.toBeInTheDocument();
    });

    it("renders the portfolio legend", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={mockFunding}
                portfolioAbbrevMap={mockAbbrevMap}
            />
        );
        expect(screen.getByTestId("portfolio-legend")).toBeInTheDocument();
    });

    it("renders gracefully with empty funding data", () => {
        render(
            <ProjectFundingByPortfolioCard
                fiscalYear={2025}
                fundingByPortfolio={[]}
                portfolioAbbrevMap={mockAbbrevMap}
            />
        );
        expect(screen.getByText("FY 2025 Project Funding by Portfolio")).toBeInTheDocument();
    });
});
