import {
    FALLBACK_COLOR,
    PORTFOLIO_ORDER
} from "../../Portfolios/PortfolioSummaryCards/PortfolioSummaryCards.constants";
import { computeDisplayPercents } from "../../../helpers/utils";

/**
 * Build chart data for the "Project Funding by Portfolio" horizontal stacked bar.
 * Colors are resolved from PORTFOLIO_ORDER by abbreviation.
 * Items are sorted by their position in PORTFOLIO_ORDER so bars and legend
 * always appear in the same canonical left-to-right sequence as PortfolioSummaryCards.
 * Abbreviations come directly from the funding API response (item.abbreviation).
 *
 * @param {Array<{portfolio_id: number, portfolio: string, amount: number, abbreviation: string|null}>} fundingByPortfolio
 * @returns {Array} Normalised chart data ready for HorizontalStackedBar and inline legend
 */
export const buildPortfolioChartData = (fundingByPortfolio) => {
    if (!fundingByPortfolio?.length) return [];

    const rawItems = fundingByPortfolio.map((item) => {
        const abbreviation = item.abbreviation ?? "";
        const configIndex = PORTFOLIO_ORDER.findIndex(
            (c) => c.abbreviation === abbreviation || c.aliases?.includes(abbreviation)
        );
        const config = configIndex !== -1 ? PORTFOLIO_ORDER[configIndex] : null;

        return {
            id: item.portfolio_id,
            label: item.portfolio,
            abbreviation: abbreviation || item.portfolio,
            value: item.amount,
            color: config?.color ?? FALLBACK_COLOR,
            _order: configIndex !== -1 ? configIndex : Infinity
        };
    });

    // Sort by canonical PORTFOLIO_ORDER position so bar segments and legend
    // always appear in the same left-to-right sequence as PortfolioSummaryCards.
    rawItems.sort((a, b) => a._order - b._order);

    const result = computeDisplayPercents(rawItems);
    // Strip internal sort key before returning
    result.forEach((item) => delete item._order);
    return result;
};
