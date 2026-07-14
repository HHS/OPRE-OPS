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

    it("assigns each portfolio its fixed color from PORTFOLIO_ORDER by abbreviation", () => {
        const result = buildPortfolioChartData(mockFundingByPortfolio);
        expect(result[0].color).toBe("var(--portfolio-bar-graph-cc)"); // CC's fixed color
        expect(result[1].color).toBe("var(--portfolio-bar-graph-cw)"); // CWR's fixed color
    });

    it("gives each portfolio its own fixed color regardless of which others are present", () => {
        // Colors must match PortfolioSummaryCards — HS keeps hs, OCDO keeps ocdo,
        // never a compacted sequential slot.
        const sparse = [
            { portfolio_id: 8, portfolio: "OCDO Portfolio", amount: 7000000, abbreviation: "OCDO" },
            { portfolio_id: 2, portfolio: "Head Start Research", amount: 10000000, abbreviation: "HS" },
            { portfolio_id: 3, portfolio: "Child Care Research", amount: 1140000, abbreviation: "CC" }
        ];
        const result = buildPortfolioChartData(sparse);
        expect(result[0].abbreviation).toBe("CC");
        expect(result[0].color).toBe("var(--portfolio-bar-graph-cc)");
        expect(result[1].abbreviation).toBe("HS");
        expect(result[1].color).toBe("var(--portfolio-bar-graph-hs)");
        expect(result[2].abbreviation).toBe("OCDO");
        expect(result[2].color).toBe("var(--portfolio-bar-graph-ocdo)");
    });

    it("resolves color via aliases (e.g. HMRF, DD→DO)", () => {
        const withAlias = [
            { portfolio_id: 5, portfolio: "Healthy Marriage", amount: 500000, abbreviation: "HMRF" },
            { portfolio_id: 6, portfolio: "Division of Data", amount: 250000, abbreviation: "DD" }
        ];
        const result = buildPortfolioChartData(withAlias);
        const hmrf = result.find((r) => r.abbreviation === "HMRF");
        const dd = result.find((r) => r.abbreviation === "DD");
        expect(hmrf.color).toBe("var(--portfolio-bar-graph-hmrf)");
        expect(dd.color).toBe("var(--portfolio-bar-graph-dd)"); // DD is an alias of DO
    });

    it("falls back to FALLBACK_COLOR for unknown portfolios", () => {
        const withUnknown = [
            { portfolio_id: 3, portfolio: "Child Care Research", amount: 500000, abbreviation: "CC" },
            { portfolio_id: 99, portfolio: "Unknown Portfolio", amount: 100000, abbreviation: "UNK" }
        ];
        const result = buildPortfolioChartData(withUnknown);
        expect(result.find((r) => r.abbreviation === "UNK").color).toBe("var(--data-viz-bl-by-status-1)");
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
