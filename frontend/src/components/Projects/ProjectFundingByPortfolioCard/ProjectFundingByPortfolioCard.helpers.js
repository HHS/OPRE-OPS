import {
    FALLBACK_COLOR,
    PORTFOLIO_ORDER
} from "../../Portfolios/PortfolioSummaryCards/PortfolioSummaryCards.constants";
import { computeDisplayPercents } from "../../../helpers/utils";

/**
 * Build chart data for the "Project Funding by Portfolio" horizontal stacked bar.
 * Colors are resolved from PORTFOLIO_ORDER by abbreviation.
 * Abbreviations come directly from the funding API response (item.abbreviation).
 *
 * @param {Array<{portfolio_id: number, portfolio: string, amount: number, abbreviation: string|null}>} fundingByPortfolio
 * @returns {Array} Normalised chart data ready for HorizontalStackedBar and PortfolioLegend
 */
export const buildPortfolioChartData = (fundingByPortfolio) => {
    if (!fundingByPortfolio?.length) return [];

    const rawItems = fundingByPortfolio.map((item) => {
        const abbreviation = item.abbreviation ?? "";
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
