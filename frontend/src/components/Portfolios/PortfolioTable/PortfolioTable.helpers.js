import { PORTFOLIO_SORT_CODES } from "./PortfolioTable.constants";
import { sortPortfoliosByStaticOrder } from "../PortfolioSummaryCards/PortfolioSummaryCards.helpers";

/**
 * Sorts portfolios with funding data based on the sort condition and direction
 * @param {Array} portfoliosWithFunding - Array of portfolio objects with fundingSummary attached
 * @param {string} sortCondition - The sort condition code (e.g., "PORTFOLIO_NAME", "FY_BUDGET")
 * @param {boolean} sortDescending - Whether to sort in descending order
 * @returns {Array} Sorted array of portfolios
 */
export const sortPortfolios = (portfoliosWithFunding, sortCondition, sortDescending) => {
    if (!portfoliosWithFunding || portfoliosWithFunding.length === 0) {
        return [];
    }

    // Handle STATIC_ORDER early - no need to run generic sort
    if (sortCondition === PORTFOLIO_SORT_CODES.STATIC_ORDER) {
        const staticSorted = sortPortfoliosByStaticOrder(portfoliosWithFunding);
        return sortDescending ? staticSorted.reverse() : staticSorted;
    }

    const sorted = [...portfoliosWithFunding].sort((a, b) => {
        let aValue, bValue;

        switch (sortCondition) {
            case PORTFOLIO_SORT_CODES.PORTFOLIO_NAME:
                aValue = a.name || "";
                bValue = b.name || "";
                return aValue.localeCompare(bValue);

            case PORTFOLIO_SORT_CODES.DIVISION: {
                // Custom division sort order
                const divisionOrder = {
                    DCFD: 1,
                    DFS: 2,
                    DEI: 3,
                    DECONI: 3,
                    OD: 4,
                    DD: 4,
                    "Non-OPRE": 5,
                    OCDO: 6
                };

                aValue = a.division?.abbreviation || "";
                bValue = b.division?.abbreviation || "";

                const aOrder = divisionOrder[aValue] || 999;
                const bOrder = divisionOrder[bValue] || 999;
                const divisionCompare = aOrder - bOrder;

                // If divisions are the same, sort by portfolio name
                if (divisionCompare === 0) {
                    const aName = a.name || "";
                    const bName = b.name || "";
                    return aName.localeCompare(bName);
                }
                return divisionCompare;
            }

            case PORTFOLIO_SORT_CODES.FY_BUDGET:
                aValue = a.fundingSummary?.total_funding?.amount ?? 0;
                bValue = b.fundingSummary?.total_funding?.amount ?? 0;
                return aValue - bValue;

            case PORTFOLIO_SORT_CODES.FY_SPENDING:
                // Calculate spending: planned + obligated + in_execution
                aValue =
                    (a.fundingSummary?.planned_funding?.amount ?? 0) +
                    (a.fundingSummary?.obligated_funding?.amount ?? 0) +
                    (a.fundingSummary?.in_execution_funding?.amount ?? 0);
                bValue =
                    (b.fundingSummary?.planned_funding?.amount ?? 0) +
                    (b.fundingSummary?.obligated_funding?.amount ?? 0) +
                    (b.fundingSummary?.in_execution_funding?.amount ?? 0);
                return aValue - bValue;

            case PORTFOLIO_SORT_CODES.FY_AVAILABLE:
                aValue = a.fundingSummary?.available_funding?.amount ?? 0;
                bValue = b.fundingSummary?.available_funding?.amount ?? 0;
                return aValue - bValue;

            default:
                return 0;
        }
    });

    return sortDescending ? sorted.reverse() : sorted;
};
