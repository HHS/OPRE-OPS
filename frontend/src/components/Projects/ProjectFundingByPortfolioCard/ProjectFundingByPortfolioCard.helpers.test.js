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

    it("assigns sequential colors from PORTFOLIO_ORDER palette regardless of which portfolios are present", () => {
        // CC is slot 0, CWR is slot 1 in PORTFOLIO_ORDER — so sorted [CC, CWR]
        // should get palette[0] and palette[1] respectively
        const result = buildPortfolioChartData(mockFundingByPortfolio);
        expect(result[0].color).toBe("var(--portfolio-bar-graph-cc)");  // palette[0]
        expect(result[1].color).toBe("var(--portfolio-bar-graph-cw)");  // palette[1]
    });

    it("skips sparse slots — 3 present portfolios get colors 1, 2, 3 not 1, 3, 13", () => {
        // CC=slot0, HS=slot2, OCDO=slot12 in PORTFOLIO_ORDER
        // After sort: [CC, HS, OCDO] → sequential colors: palette[0], palette[1], palette[2]
        const sparse = [
            { portfolio_id: 8, portfolio: "OCDO Portfolio", amount: 7000000, abbreviation: "OCDO" },
            { portfolio_id: 2, portfolio: "Head Start Research", amount: 10000000, abbreviation: "HS" },
            { portfolio_id: 3, portfolio: "Child Care Research", amount: 1140000, abbreviation: "CC" }
        ];
        const result = buildPortfolioChartData(sparse);
        expect(result[0].abbreviation).toBe("CC");
        expect(result[0].color).toBe("var(--portfolio-bar-graph-cc)");   // palette[0]
        expect(result[1].abbreviation).toBe("HS");
        expect(result[1].color).toBe("var(--portfolio-bar-graph-cw)");   // palette[1], not HS's own slot
        expect(result[2].abbreviation).toBe("OCDO");
        expect(result[2].color).toBe("var(--portfolio-bar-graph-hs)");   // palette[2], not OCDO's own slot
    });

    it("falls back to FALLBACK_COLOR when palette is exhausted (>13 portfolios)", () => {
        const manyPortfolios = Array.from({ length: 14 }, (_, i) => ({
            portfolio_id: 100 + i,
            portfolio: `Portfolio ${i}`,
            amount: 100000,
            abbreviation: `UNK${i}`
        }));
        const result = buildPortfolioChartData(manyPortfolios);
        // First 13 get palette colors, 14th falls back
        expect(result[13].color).toBe("var(--data-viz-bl-by-status-1)");
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
