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
