import {
    FALLBACK_COLOR,
    PORTFOLIO_ORDER
} from "../../Portfolios/PortfolioSummaryCards/PortfolioSummaryCards.constants";
import { computeDisplayPercents } from "../../../helpers/utils";

/**
 * Build chart data for the "Project Funding by Portfolio" horizontal stacked bar.
 * Colors are resolved from PORTFOLIO_ORDER by abbreviation.
 * Abbreviations come from the portfolios API via portfolioAbbrevMap (portfolioId → abbreviation).
 *
 * @param {Array<{portfolio_id: number, portfolio: string, amount: number}>} fundingByPortfolio
 * @param {Map<number, string>} portfolioAbbrevMap - portfolioId → abbreviation
 * @returns {Array} Normalised chart data ready for HorizontalStackedBar and PortfolioLegend
 */
export const buildPortfolioChartData = (fundingByPortfolio, portfolioAbbrevMap) => {
    if (!fundingByPortfolio?.length) return [];

    const rawItems = fundingByPortfolio.map((item) => {
        const abbreviation = portfolioAbbrevMap?.get(item.portfolio_id) ?? "";
        const config = PORTFOLIO_ORDER.find(
            (c) => c.abbreviation === abbreviation || c.aliases?.includes(abbreviation)
        );

        return {
            id: item.portfolio_id,
            label: item.portfolio,
            abbreviation: abbreviation || item.portfolio,
            value: item.amount,
            color: config?.color ?? FALLBACK_COLOR
        };
    });

    return computeDisplayPercents(rawItems);
};
