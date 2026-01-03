/**
 * Groups portfolios by division name
 * @param {import("../../../types/PortfolioTypes").Portfolio[]} portfolios - Array of portfolio objects
 * @returns {Record<string, import("../../../types/PortfolioTypes").Portfolio[]>} Object with division names as keys and arrays of portfolios as values
 */
export const groupByDivision = (portfolios) => {
    if (!portfolios) return {};

    /** @type {Record<string, import("../../../types/PortfolioTypes").Portfolio[]>} */
    const result = {};

    return portfolios.reduce((acc, portfolio) => {
        const division = portfolio.division?.name;
        if (!division) return acc;

        if (!acc[division]) {
            acc[division] = [];
        }
        acc[division].push(portfolio);
        return acc;
    }, result);
};

/**
 * Groups portfolios by division name and doubles the entries for testing purposes
 * NOTE: Temporary code for testing - doubles entries to test rows with 4+ items
 * @param {import("../../../types/PortfolioTypes").Portfolio[]} portfolios - Array of portfolio objects
 * @returns {Record<string, import("../../../types/PortfolioTypes").Portfolio[]>} Object with division names as keys and arrays of doubled portfolios as values
 */
export const doubleByDivision = (portfolios) => {
    if (!portfolios) return {};

    /** @type {Record<string, import("../../../types/PortfolioTypes").Portfolio[]>} */
    const result = {};

    return portfolios.reduce((acc, portfolio) => {
        const division = portfolio.division?.name;
        if (!division) return acc;

        if (!acc[division]) {
            acc[division] = [];
        }
        // Add the original portfolio
        acc[division].push(portfolio);
        // Add a duplicate for testing (with modified id to avoid key conflicts)
        acc[division].push({
            ...portfolio,
            id: `${portfolio.id}_duplicate`,
            name: `${portfolio.name} (Copy)`
        });
        return acc;
    }, result);
};

/**
 * Filters portfolios to only include those where the user is a team leader
 * @param {import("../../../types/PortfolioTypes").Portfolio[]} portfolios - Array of portfolio objects
 * @param {number} userId - ID of the current user
 * @returns {import("../../../types/PortfolioTypes").Portfolio[]} Filtered array of portfolios
 */
export const filterMyPortfolios = (portfolios, userId) => {
    if (!portfolios || !userId) return [];

    return portfolios.filter((portfolio) => {
        if (!portfolio.team_leaders || !Array.isArray(portfolio.team_leaders)) {
            return false;
        }
        return portfolio.team_leaders.some((leader) => leader.id === userId);
    });
};
