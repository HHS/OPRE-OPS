import {
    FALLBACK_COLOR,
    PORTFOLIO_ORDER
} from "../../Portfolios/PortfolioSummaryCards/PortfolioSummaryCards.constants";
import { computeDisplayPercents } from "../../../helpers/utils";

/**
 * Returns the PORTFOLIO_ORDER config whose primary abbreviation or aliases match,
 * or undefined if the abbreviation is unknown.
 */
const findConfig = (abbreviation) =>
    PORTFOLIO_ORDER.find((c) => c.abbreviation === abbreviation || c.aliases?.includes(abbreviation));

/**
 * Build chart data for the "Project Funding by Portfolio" horizontal stacked bar.
 * Items are sorted by their position in PORTFOLIO_ORDER, then each portfolio is
 * assigned its fixed color from PORTFOLIO_ORDER by abbreviation — the same scheme
 * used by transformPortfoliosToChartData for the "FY Budget Across Portfolios"
 * view — so a given portfolio (e.g. HMRF) always renders with the same color
 * across both views. Unknown portfolios fall back to FALLBACK_COLOR.
 * Abbreviations come directly from the funding API response (item.abbreviation).
 *
 * @param {Array<{portfolio_id: number, portfolio: string, amount: number, abbreviation: string|null}>} fundingByPortfolio
 * @returns {Array} Normalised chart data ready for HorizontalStackedBar and inline legend
 */
export const buildPortfolioChartData = (fundingByPortfolio) => {
    if (!fundingByPortfolio?.length) return [];

    // Sort by canonical PORTFOLIO_ORDER position; unknowns go to the end
    const sorted = [...fundingByPortfolio].sort((a, b) => {
        const idxA = PORTFOLIO_ORDER.findIndex(
            (c) => c.abbreviation === (a.abbreviation ?? "") || c.aliases?.includes(a.abbreviation ?? "")
        );
        const idxB = PORTFOLIO_ORDER.findIndex(
            (c) => c.abbreviation === (b.abbreviation ?? "") || c.aliases?.includes(b.abbreviation ?? "")
        );
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    // Assign each portfolio its fixed color from PORTFOLIO_ORDER by abbreviation
    // so colors stay consistent with the PortfolioSummaryCards view.
    const rawItems = sorted.map((item) => ({
        id: item.portfolio_id,
        label: item.portfolio,
        abbreviation: item.abbreviation || item.portfolio,
        value: item.amount,
        color: findConfig(item.abbreviation)?.color ?? FALLBACK_COLOR
    }));

    return computeDisplayPercents(rawItems);
};
