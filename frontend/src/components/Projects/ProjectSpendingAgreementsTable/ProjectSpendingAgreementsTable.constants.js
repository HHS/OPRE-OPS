import { getFyLabel } from "../ProjectSpending.helpers";

/**
 * Returns column headings for the Project Spending Agreements table.
 * Does NOT include the empty chevron column — the main table appends "" itself
 * and the skeleton loading component uses hasExpandableRows instead.
 *
 * @param {number | "All"} fiscalYear
 * @returns {string[]}
 */
export const getTableHeadings = (fiscalYear) => {
    const fyLabel = getFyLabel(fiscalYear);
    return ["Agreement", "Type", "Start", "End", `${fyLabel} Total`, "Agreement Total"];
};
