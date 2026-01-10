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

/**
 * Handles exporting portfolio data to Excel format
 * @param {Function} exportTableToXlsx - Export helper function from tableExport.helpers
 * @param {Function} setIsExporting - State setter for export loading state
 * @param {number|string} fiscalYear - Current selected fiscal year
 * @param {import("../../../types/PortfolioTypes").Portfolio[]} filteredPortfolios - Array of portfolios with funding data
 * @returns {Promise<void>}
 */
export const handlePortfolioExport = async (exportTableToXlsx, setIsExporting, fiscalYear, filteredPortfolios) => {
    try {
        setIsExporting(true);

        const tableHeaders = [
            "Portfolio Name",
            "FY Total Budget",
            "FY Available Budget",
            "FY Spending"
        ];

        await exportTableToXlsx({
            data: filteredPortfolios,
            headers: tableHeaders,
            rowMapper: (portfolio) => {
                // Calculate spending: planned + obligated + in_execution
                const spending =
                    (portfolio.fundingSummary?.planned_funding?.amount || 0) +
                    (portfolio.fundingSummary?.obligated_funding?.amount || 0) +
                    (portfolio.fundingSummary?.in_execution_funding?.amount || 0);

                const portfolioName = portfolio.name || "";
                const totalBudget = portfolio.fundingSummary?.total_funding?.amount || 0;
                const availableBudget = portfolio.fundingSummary?.available_funding?.amount || 0;

                return [portfolioName, totalBudget, availableBudget, spending];
            },
            filename: `portfolios_FY${fiscalYear}`,
            currencyColumns: [1, 2, 3] // Total Budget, Available Budget, Spending
        });
    } catch (error) {
        console.error("Failed to export portfolio data:", error);
    } finally {
        setIsExporting(false);
    }
};
