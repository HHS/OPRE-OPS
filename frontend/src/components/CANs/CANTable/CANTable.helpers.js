/**
 * Formats the obligate by date to the last day of the fiscal year.
 * @param {number | undefined} obligateBy - The obligate by value
 * @returns {string} Formatted date string or "TBD"
 */
export const formatObligateBy = (obligateBy) => {
    if (!obligateBy) return "TBD"; // Default value
    if (typeof obligateBy !== "number" || isNaN(obligateBy)) return "TBD"; // Default if parsing fails

    const getDateFromFiscalYear = new Date(obligateBy, 8, 30);

    // Format as MM/DD/YY
    return getDateFromFiscalYear.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit"
    });
};

/**
 * function to filter funding_budgets fiscal year by fiscal year
 * @param {import("../../../types/CANTypes").CAN} can - CAN object
 * @param {number} fiscalYear - Fiscal year to filter by
 * @returns {number} - Fiscal year of the funding budget
 */
export function findFundingBudgetFYByFiscalYear(can, fiscalYear) {
    if (!can || !fiscalYear) return 0;
    const matchingBudget = can.funding_budgets?.find((budget) => budget.fiscal_year === fiscalYear);

    return matchingBudget ? matchingBudget.fiscal_year : 0;
}
/**
 * function to filter funding_budgets budget by fiscal year
 * @param {import("../../../types/CANTypes").CAN} can - CAN object
 * @param {number} fiscalYear - Fiscal year to filter by
 * @returns {number} - Fiscal year of the funding budget
 */
export function findFundingBudgetBudgetByFiscalYear(can, fiscalYear) {
    if (!can || !fiscalYear) return 0;
    const matchingBudget = can.funding_budgets?.find((budget) => budget.fiscal_year === fiscalYear);

    return matchingBudget ? matchingBudget.budget : 0;
}
