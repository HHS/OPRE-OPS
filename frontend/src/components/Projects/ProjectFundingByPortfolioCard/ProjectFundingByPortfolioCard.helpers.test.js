import { describe, it, expect } from "vitest";
import { buildPortfolioChartData } from "./ProjectFundingByPortfolioCard.helpers";

const mockFundingByPortfolio = [
    { portfolio_id: 3, portfolio: "Child Care Research", amount: 500000, abbreviation: "CC" },
    { portfolio_id: 1, portfolio: "Child Welfare Research", amount: 250000, abbreviation: "CWR" }
];

describe("buildPortfolioChartData", () => {
    it("returns empty array for empty input", () => {
        expect(buildPortfolioChartData([])).toEqual([]);
        expect(buildPortfolioChartData(null)).toEqual([]);
        expect(buildPortfolioChartData(undefined)).toEqual([]);
    });

    it("reads abbreviation directly from the item", () => {
        const result = buildPortfolioChartData(mockFundingByPortfolio);
        expect(result[0].abbreviation).toBe("CC");
        expect(result[1].abbreviation).toBe("CWR");
    });

    it("sorts items by canonical PORTFOLIO_ORDER position regardless of API order", () => {
        // API returns CWR before CC, but CC comes first in PORTFOLIO_ORDER
        const reversed = [
            { portfolio_id: 1, portfolio: "Child Welfare Research", amount: 250000, abbreviation: "CWR" },
            { portfolio_id: 3, portfolio: "Child Care Research", amount: 500000, abbreviation: "CC" }
        ];
        const result = buildPortfolioChartData(reversed);
        expect(result[0].abbreviation).toBe("CC");
        expect(result[1].abbreviation).toBe("CWR");
    });

    it("appends unknown portfolios after known ones", () => {
        const withUnknown = [
            { portfolio_id: 99, portfolio: "Unknown Portfolio", amount: 100000, abbreviation: "UNK" },
            { portfolio_id: 3, portfolio: "Child Care Research", amount: 500000, abbreviation: "CC" }
        ];
        const result = buildPortfolioChartData(withUnknown);
        expect(result[0].abbreviation).toBe("CC");
        expect(result[1].abbreviation).toBe("UNK");
    });

    it("falls back to portfolio name when abbreviation is null", () => {
        const noAbbrev = mockFundingByPortfolio.map((item) => ({ ...item, abbreviation: null }));
        const result = buildPortfolioChartData(noAbbrev);
        expect(result[0].abbreviation).toBe("Child Care Research");
    });

    it("assigns a known color from PORTFOLIO_ORDER for a known abbreviation", () => {
        const result = buildPortfolioChartData(mockFundingByPortfolio);
        expect(result[0].color).toMatch(/var\(--portfolio-bar-graph-/);
    });

    it("falls back to FALLBACK_COLOR for unknown abbreviations", () => {
        const unknownAbbrev = mockFundingByPortfolio.map((item) => ({ ...item, abbreviation: "ZZZZZ" }));
        const result = buildPortfolioChartData(unknownAbbrev);
        result.forEach((item) => {
            expect(item.color).toBe("var(--data-viz-bl-by-status-1)");
        });
    });

    it("applies computeDisplayPercents so percents sum correctly", () => {
        const result = buildPortfolioChartData(mockFundingByPortfolio);
        const total = result.reduce((sum, item) => {
            const p = typeof item.percent === "number" ? item.percent : 1;
            return sum + p;
        }, 0);
        expect(total).toBe(100);
    });

    it("preserves amount as value", () => {
        const result = buildPortfolioChartData(mockFundingByPortfolio);
        expect(result[0].value).toBe(500000);
        expect(result[1].value).toBe(250000);
    });
});
