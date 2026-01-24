import { calculatePercent } from "../../../helpers/utils";
import { PORTFOLIO_ORDER, FALLBACK_COLOR } from "./PortfolioSummaryCards.constants";

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
 * Finds the portfolio order configuration for a given abbreviation
 * Handles aliases (e.g., "ADR" -> "AD")
 * @param {string} abbreviation - Portfolio abbreviation
 * @returns {Object|null} Portfolio order config or null if not found
 */
const findPortfolioOrderConfig = (abbreviation) => {
    return PORTFOLIO_ORDER.find((config) => {
        if (config.abbreviation === abbreviation) {
            return true;
        }
        if (config.aliases && config.aliases.includes(abbreviation)) {
            return true;
        }
        return false;
    });
};

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

    // Create a copy to avoid mutating original array
    const portfoliosCopy = [...portfolios];

    // Separate portfolios into those in order and those not
    const inOrder = [];
    const notInOrder = [];

    portfoliosCopy.forEach((portfolio) => {
        const config = findPortfolioOrderConfig(portfolio.abbreviation);
        if (config) {
            inOrder.push(portfolio);
        } else {
            notInOrder.push(portfolio);
            // Log warning in development
            if (process.env.NODE_ENV === "development") {
                console.warn(
                    `Portfolio "${portfolio.abbreviation}" (${portfolio.name}) not found in PORTFOLIO_ORDER. Appending to end.`
                );
            }
        }
    });

    // Sort portfolios that are in PORTFOLIO_ORDER
    inOrder.sort((a, b) => {
        const indexA = PORTFOLIO_ORDER.findIndex(
            (config) =>
                config.abbreviation === a.abbreviation || (config.aliases && config.aliases.includes(a.abbreviation))
        );
        const indexB = PORTFOLIO_ORDER.findIndex(
            (config) =>
                config.abbreviation === b.abbreviation || (config.aliases && config.aliases.includes(b.abbreviation))
        );
        return indexA - indexB;
    });

    // Return sorted portfolios with unknown ones at the end
    return [...inOrder, ...notInOrder];
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

    // Create a map of abbreviation -> portfolio for quick lookup
    const portfolioMap = new Map();
    sortedPortfolios.forEach((portfolio) => {
        portfolioMap.set(portfolio.abbreviation, portfolio);
    });

    // Define column boundaries based on PORTFOLIO_ORDER (4 columns with 4 rows max)
    // Column 1: indices 0-3, Column 2: 4-7, Column 3: 8-10, Column 4: 11-12
    const columnBoundaries = [
        { start: 0, end: 4 },   // Column 1: CC, CWR, HS, OTIP
        { start: 4, end: 8 },   // Column 2: ADR, HMRF, HV, DV
        { start: 8, end: 11 },  // Column 3: WR, DO, OD
        { start: 11, end: 13 }  // Column 4: Non-OPRE, OCDO
    ];

    const ROWS_PER_COLUMN = 4;
    const result = [];
    const processedAbbreviations = new Set();

    // Process each column separately
    columnBoundaries.forEach((boundary) => {
        const columnItems = [];

        // Collect existing portfolios for this column
        for (let i = boundary.start; i < boundary.end; i++) {
            const config = PORTFOLIO_ORDER[i];

            // Check for portfolio using abbreviation or aliases
            let portfolio = portfolioMap.get(config.abbreviation);
            if (!portfolio && config.aliases) {
                // Check aliases
                for (const alias of config.aliases) {
                    portfolio = portfolioMap.get(alias);
                    if (portfolio) break;
                }
            }

            if (portfolio) {
                const value = portfolio?.fundingSummary?.total_funding?.amount || 0;
                const percent = calculatePercent(value, totalBudget);

                columnItems.push({
                    id: portfolio.id || i,
                    label: portfolio.name || portfolio.abbreviation,
                    abbreviation: portfolio.abbreviation,
                    value: Number(value),
                    color: config.color,
                    percent
                });
                processedAbbreviations.add(portfolio.abbreviation);
            }
        }

        // Add the existing items to result
        result.push(...columnItems);

        // Pad the column with placeholders to maintain grid alignment (always 4 rows)
        const placeholdersNeeded = ROWS_PER_COLUMN - columnItems.length;
        for (let i = 0; i < placeholdersNeeded; i++) {
            result.push({
                id: `placeholder-col${boundary.start}-${i}`,
                label: "",
                abbreviation: "",
                value: 0,
                color: "",
                percent: 0,
                isPlaceholder: true
            });
        }
    });

    // Handle unknown portfolios (not in PORTFOLIO_ORDER) - append at the end
    sortedPortfolios.forEach((portfolio, index) => {
        if (!processedAbbreviations.has(portfolio.abbreviation)) {
            const value = portfolio?.fundingSummary?.total_funding?.amount || 0;
            const percent = calculatePercent(value, totalBudget);

            result.push({
                id: portfolio.id || `unknown-${index}`,
                label: portfolio.name || portfolio.abbreviation,
                abbreviation: portfolio.abbreviation,
                value: Number(value),
                color: FALLBACK_COLOR,
                percent
            });
        }
    });

    return result;
};
