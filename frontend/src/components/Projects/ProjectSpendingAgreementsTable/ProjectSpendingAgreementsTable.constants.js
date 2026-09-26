/**
 * Returns column headings for the Project Spending Agreements table.
 * Does NOT include the empty chevron column — the main table appends "" itself
 * and the skeleton loading component uses hasExpandableRows instead.
 *
 * @param {number} fiscalYear
 * @returns {string[]}
 */
export const getTableHeadings = (fiscalYear) => [
    "Agreement",
    "Type",
    "Start",
    "End",
    `FY ${fiscalYear} Total`,
    "Agreement Total"
];
