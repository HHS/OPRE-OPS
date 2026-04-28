import {
    FALLBACK_COLOR,
    PORTFOLIO_ORDER
} from "../../Portfolios/PortfolioSummaryCards/PortfolioSummaryCards.constants";
import { computeDisplayPercents } from "../../../helpers/utils";

/**
 * Build chart data for the "Project Funding by Portfolio" horizontal stacked bar.
 * Items are sorted by their position in PORTFOLIO_ORDER, then colors are assigned
 * sequentially (slot 1, 2, 3 …) so a project with 3 portfolios always shows
 * the first 3 colors from the palette — matching the visual sequence on the
 * reporting page — rather than the sparse slots of each abbreviation's fixed color.
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

    // Assign colors sequentially from PORTFOLIO_ORDER so 3 portfolios always
    // get colors #1, #2, #3 rather than their sparse fixed slots (e.g. 1, 3, 13).
    const paletteColors = PORTFOLIO_ORDER.map((c) => c.color);

    const rawItems = sorted.map((item, i) => ({
        id: item.portfolio_id,
        label: item.portfolio,
        abbreviation: item.abbreviation || item.portfolio,
        value: item.amount,
        color: paletteColors[i] ?? FALLBACK_COLOR
    }));

    return computeDisplayPercents(rawItems);
};
