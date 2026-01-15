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
 * @param {Array} sortedPortfolios - Sorted portfolio array
 * @param {number} totalBudget - Sum of all portfolio budgets
 * @returns {Array} Data array with { id, label, abbreviation, value, color, percent }
 */
export const transformPortfoliosToChartData = (sortedPortfolios, totalBudget) => {
    if (!sortedPortfolios || !Array.isArray(sortedPortfolios)) {
        return [];
    }

    return sortedPortfolios.map((portfolio, index) => {
        const value = portfolio?.fundingSummary?.total_funding?.amount || 0;
        const percent = calculatePercent(value, totalBudget);

        // Find color from PORTFOLIO_ORDER
        const config = findPortfolioOrderConfig(portfolio.abbreviation);
        const color = config ? config.color : FALLBACK_COLOR;

        return {
            id: portfolio.id || index,
            label: portfolio.name || portfolio.abbreviation,
            abbreviation: portfolio.abbreviation,
            value: Number(value),
            color,
            percent
        };
    });
};
