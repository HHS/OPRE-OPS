/**
 * @typedef {import('./././CANFilterButton/CANFilterTypes').FilterOption} FilterOption
 * @typedef {import('./././CANFilterButton/CANFilterTypes').Filters} Filters
 * @typedef {import("../../../types/CANTypes").CAN} CAN
 */

/**
 * NOTE: The sortAndFilterCANs and applyAdditionalFilters functions have been removed
 * as filtering and sorting are now handled server-side by the /cans API endpoint.
 * See CanList.jsx for the new implementation using useGetCansQuery with filter parameters.
 */

/**
 * @description Returns a set of unique portfolios from the CANs list
 * @param {CAN[]} cans - The array of CANs to filter.
 * @returns {FilterOption[]} - The filtered array of portfolios.
 */
export const getPortfolioOptions = (cans) => {
    if (!cans || cans.length === 0) {
        return [];
    }
    const portfolios = cans.reduce((acc, can) => {
        const { name, abbreviation } = can.portfolio;
        const uniqueKey = `${name}_${abbreviation}`;
        acc.add(uniqueKey);
        return acc;
    }, new Set());

    return Array.from(portfolios)
        .sort((a, b) => {
            const [nameA] = a.split("_");
            const [nameB] = b.split("_");
            return nameA.localeCompare(nameB);
        })
        .map((uniqueKey, index) => {
            const [name, abbr] = uniqueKey.split("_");
            return {
                id: index,
                title: `${name} (${abbr})`,
                abbr: abbr
            };
        });
};

/**
 * @description Returns a sorted array of unique fiscal year budgets from the CANs list
 * @param {CAN[]} cans - The array of CANs to filter.
 * @param {number} fiscalYear - The fiscal year to filter by.
 * @returns {number[]} - The sorted array of budgets.
 */
export const getSortedFYBudgets = (cans, fiscalYear) => {
    if (!cans || cans.length === 0) {
        return [];
    }

    const budgets = cans.flatMap((can) =>
        (can.funding_budgets || [])
            .filter((budget) => budget.fiscal_year === fiscalYear && budget.budget != null)
            .map((budget) => budget.budget)
    );

    const uniqueBudgets = [...new Set(budgets)].filter((budget) => budget !== undefined).sort((a, b) => a - b);

    // If there's only one budget value, create a range by adding a slightly larger value
    if (uniqueBudgets.length === 1) {
        const singleValue = uniqueBudgets[0] ?? 0;
        return [singleValue, singleValue * 1.1]; // Add 10% to create a range
    }

    return uniqueBudgets;
};
