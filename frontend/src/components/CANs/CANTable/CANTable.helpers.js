/**
 * Gets the last day of the fiscal year for a given year.
 * @param {number} fiscalYear - The fiscal year
 * @returns {Date} The last day of the fiscal year
 */
const getLastDayOfFiscalYear = (fiscalYear) => {
    // Fiscal year ends on September 30 of the previous calendar year
    return new Date(fiscalYear - 1, 8, 30); // Month is 0-indexed, so 8 is September
};
/**
 * Formats the obligate by date to the last day of the fiscal year.
 * @param {number | undefined} obligateBy - The obligate by value
 * @returns {string} Formatted date string or "TBD"
 */
export const formatObligateBy = (obligateBy) => {
    if (!obligateBy) return "TBD"; // Default value
    if (typeof obligateBy !== "number" || isNaN(obligateBy)) return "TBD"; // Default if parsing fails

    const lastDay = getLastDayOfFiscalYear(obligateBy);

    // Format as MM/DD/YY
    return lastDay.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit"
    });
};

/**
 * function to filter funding_budgets fiscal year by fiscal year
 * @param {import("../CANTypes").CAN} can - CAN object
 * @param {number} fiscalYear - Fiscal year to filter by
 * @returns {number} - Fiscal year of the funding budget
 */
export function findFundingBudgetFYByFiscalYear(can, fiscalYear) {
    if (!can || !fiscalYear) return 0;
    const matchingBudget = can.funding_budgets.find((budget) => budget.fiscal_year === fiscalYear);

    return matchingBudget ? matchingBudget.fiscal_year : 0;
}
/**
 * function to filter funding_budgets budget by fiscal year
 * @param {import("../CANTypes").CAN} can - CAN object
 * @param {number} fiscalYear - Fiscal year to filter by
 * @returns {number} - Fiscal year of the funding budget
 */
export function findFundingBudgetBudgetByFiscalYear(can, fiscalYear) {
    if (!can || !fiscalYear) return 0;
    const matchingBudget = can.funding_budgets.find((budget) => budget.fiscal_year === fiscalYear);

    return matchingBudget ? matchingBudget.budget : 0;
}
