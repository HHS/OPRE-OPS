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
