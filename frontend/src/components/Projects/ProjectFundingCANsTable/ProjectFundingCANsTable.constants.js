/**
 * Returns the column headings for the Project Funding by CAN table.
 * The FY funding column header is dynamic based on the selected fiscal year.
 *
 * @param {number} fiscalYear - Selected fiscal year
 * @returns {string[]}
 */
export const getTableHeadings = (fiscalYear) => {
    const twoDigitYear = String(fiscalYear).slice(-2);
    return ["CAN", "Portfolio", "Active Period", `FY ${twoDigitYear} Project Funding`, "Lifetime Project Funding"];
};

export const COLUMN_WIDTHS = ["40%", "60%", "50%", "60%", "65%"];

/**
 * Format active_period integer as a human-readable string.
 * @param {number | null | undefined} activePeriod
 * @returns {string}
 */
export const formatActivePeriod = (activePeriod) => {
    if (activePeriod == null) return "TBD";
    return activePeriod === 1 ? "1 Year" : `${activePeriod} Years`;
};
