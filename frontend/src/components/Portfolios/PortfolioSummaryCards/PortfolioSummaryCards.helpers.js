import { computeDisplayPercents } from "../../../helpers/utils";
import {
    PORTFOLIO_ORDER,
    FALLBACK_COLOR,
    ROWS_PER_COLUMN,
    NUM_COLUMNS,
    UNKNOWN_PORTFOLIO_COLUMN
} from "./PortfolioSummaryCards.constants";

/**
 * Calculates total budget across all portfolios
 * @param {Array} portfolios - Array of portfolio objects with fundingSummary
 * @returns {number} Total budget amount
 */
export const calculateTotalBudget = (portfolios) => {
    if (!portfolios || !Array.isArray(portfolios)) {
        return 0;
    }

    return portfolios.reduce((total, portfolio) => {
        const fundingAmount = portfolio?.fundingSummary?.total_funding?.amount || 0;
        return total + Number(fundingAmount);
    }, 0);
};

/**
 * Returns true if abbreviation matches config's primary abbreviation or aliases
 */
const matchesConfig = (abbreviation, config) =>
    config.abbreviation === abbreviation || (config.aliases && config.aliases.includes(abbreviation));

/**
 * Sorts portfolios according to static PORTFOLIO_ORDER
 * Portfolios not in PORTFOLIO_ORDER are appended to the end
 * @param {Array} portfolios - Array of portfolio objects
 * @returns {Array} Sorted portfolios
 */
export const sortPortfoliosByStaticOrder = (portfolios) => {
    if (!portfolios || !Array.isArray(portfolios)) {
        return [];
    }

    if (process.env.NODE_ENV === "development") {
        const unknowns = portfolios.filter((p) => !PORTFOLIO_ORDER.some((c) => matchesConfig(p.abbreviation, c)));
        unknowns.forEach((p) => {
            console.warn(`Portfolio "${p.abbreviation}" (${p.name}) not found in PORTFOLIO_ORDER. Appending to end.`);
        });
    }

    return [...portfolios].sort((a, b) => {
        const idxA = PORTFOLIO_ORDER.findIndex((c) => matchesConfig(a.abbreviation, c));
        const idxB = PORTFOLIO_ORDER.findIndex((c) => matchesConfig(b.abbreviation, c));
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });
};

/**
 * Transforms portfolios into data format for horizontal stacked bar chart
 * Maintains grid column positions while compacting each column (no gaps)
 * @param {Array} sortedPortfolios - Sorted portfolio array
 * @param {number} totalBudget - Sum of all portfolio budgets
 * @returns {Array} Data array with { id, label, abbreviation, value, color, percent }
 */
export const transformPortfoliosToChartData = (sortedPortfolios, totalBudget) => {
    if (!sortedPortfolios || !Array.isArray(sortedPortfolios)) {
        return [];
    }

    // Build a map of abbreviation -> portfolio for quick lookup
    const portfolioMap = new Map();
    sortedPortfolios.forEach((portfolio) => {
        portfolioMap.set(portfolio.abbreviation, portfolio);
    });

    // Track which abbreviations we've matched to known configs
    const matchedAbbreviations = new Set();

    // Build columns 1..NUM_COLUMNS from PORTFOLIO_ORDER configs — without percents
    // (percents are computed in one cross-item pass below to avoid rounding drift)
    const columns = Array.from({ length: NUM_COLUMNS }, () => []);

    for (const config of PORTFOLIO_ORDER) {
        let portfolio = portfolioMap.get(config.abbreviation);
        if (!portfolio && config.aliases) {
            for (const alias of config.aliases) {
                portfolio = portfolioMap.get(alias);
                if (portfolio) break;
            }
        }

        if (portfolio) {
            const value = portfolio?.fundingSummary?.total_funding?.amount || 0;

            columns[config.column - 1].push({
                id: portfolio.id || PORTFOLIO_ORDER.indexOf(config),
                label: portfolio.name || portfolio.abbreviation,
                abbreviation: portfolio.abbreviation,
                value: Number(value),
                color: config.color
            });
            matchedAbbreviations.add(portfolio.abbreviation);
        }
    }

    // Collect unknowns and append to the unknown portfolio column
    const unknowns = sortedPortfolios.filter((p) => !matchedAbbreviations.has(p.abbreviation));
    const unknownCol = columns[UNKNOWN_PORTFOLIO_COLUMN - 1];
    unknowns.forEach((portfolio, idx) => {
        if (unknownCol.length >= ROWS_PER_COLUMN) return;
        const value = portfolio?.fundingSummary?.total_funding?.amount || 0;

        unknownCol.push({
            id: portfolio.id || `unknown-${idx}`,
            label: portfolio.name || portfolio.abbreviation,
            abbreviation: portfolio.abbreviation,
            value: Number(value),
            color: FALLBACK_COLOR
        });
    });

    // Flatten all real items, apply cross-item percent normalisation in one
    // pass (99-cap when dominant + <1% guard), then re-index by id for fast lookup.
    //
    // Use totalBudget as the true denominator so that percents are "% of total
    // budget" rather than "% of displayed items". If unknown portfolios were
    // truncated from the grid (ROWS_PER_COLUMN exceeded), inject a synthetic
    // remainder item so computeDisplayPercents still uses the full denominator
    // while preserving its display-percent rules for rendered items.
    const allRealItems = columns.flat();
    const displayedTotal = allRealItems.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const normalisationItems =
        totalBudget > displayedTotal
            ? [
                  ...allRealItems,
                  {
                      id: "__truncated-remainder__",
                      label: "",
                      abbreviation: "",
                      value: totalBudget - displayedTotal,
                      color: "",
                      isPlaceholder: true
                  }
              ]
            : allRealItems;
    const normalised = computeDisplayPercents(normalisationItems);
    const percentById = new Map(normalised.map((item) => [item.id, item.percent]));

    // Pad each column to ROWS_PER_COLUMN with placeholders and flatten
    const result = [];
    columns.forEach((col, colIdx) => {
        col.forEach((item) => {
            result.push({ ...item, percent: percentById.get(item.id) ?? 0 });
        });
        for (let i = col.length; i < ROWS_PER_COLUMN; i++) {
            result.push({
                id: `placeholder-${colIdx + 1}-${i}`,
                label: "",
                abbreviation: "",
                value: 0,
                color: "",
                percent: 0,
                isPlaceholder: true
            });
        }
    });

    return result;
};
