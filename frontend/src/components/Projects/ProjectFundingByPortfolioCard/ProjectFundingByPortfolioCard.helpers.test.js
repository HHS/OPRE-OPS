import { describe, it, expect } from "vitest";
import { buildPortfolioChartData } from "./ProjectFundingByPortfolioCard.helpers";

const mockFundingByPortfolio = [
    { portfolio_id: 3, portfolio: "Child Care Research", amount: 500000 },
    { portfolio_id: 1, portfolio: "Child Welfare Research", amount: 250000 }
];

const mockAbbrevMap = new Map([
    [3, "CC"],
    [1, "CWR"]
]);

describe("buildPortfolioChartData", () => {
    it("returns empty array for empty input", () => {
        expect(buildPortfolioChartData([], mockAbbrevMap)).toEqual([]);
        expect(buildPortfolioChartData(null, mockAbbrevMap)).toEqual([]);
        expect(buildPortfolioChartData(undefined, mockAbbrevMap)).toEqual([]);
    });

    it("maps portfolio_id to abbreviation via portfolioAbbrevMap", () => {
        const result = buildPortfolioChartData(mockFundingByPortfolio, mockAbbrevMap);
        expect(result[0].abbreviation).toBe("CC");
        expect(result[1].abbreviation).toBe("CWR");
    });

    it("falls back to portfolio name when abbreviation map has no entry", () => {
        const result = buildPortfolioChartData(mockFundingByPortfolio, new Map());
        expect(result[0].abbreviation).toBe("Child Care Research");
    });

    it("assigns a known color from PORTFOLIO_ORDER for a known abbreviation", () => {
        const result = buildPortfolioChartData(mockFundingByPortfolio, mockAbbrevMap);
        expect(result[0].color).toMatch(/var\(--portfolio-bar-graph-/);
    });

    it("falls back to FALLBACK_COLOR for unknown abbreviations", () => {
        const unknownMap = new Map([
            [3, "ZZZZZ"],
            [1, "YYYYY"]
        ]);
        const result = buildPortfolioChartData(mockFundingByPortfolio, unknownMap);
        result.forEach((item) => {
            expect(item.color).toBe("var(--data-viz-bl-by-status-1)");
        });
    });

    it("applies computeDisplayPercents so percents sum correctly", () => {
        const result = buildPortfolioChartData(mockFundingByPortfolio, mockAbbrevMap);
        const total = result.reduce((sum, item) => {
            const p = typeof item.percent === "number" ? item.percent : 1;
            return sum + p;
        }, 0);
        expect(total).toBe(100);
    });

    it("preserves amount as value", () => {
        const result = buildPortfolioChartData(mockFundingByPortfolio, mockAbbrevMap);
        expect(result[0].value).toBe(500000);
        expect(result[1].value).toBe(250000);
    });
});
