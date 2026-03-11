import { convertCodeForDisplay, formatDate } from "../../../helpers/utils";

/**
 * Sort codes for the barebones projects list table.
 * @type {{PROJECT: string, TYPE: string, START: string}}
 */
export const PROJECT_SORT_CODES = {
    PROJECT: "PROJECT",
    TYPE: "TYPE",
    START: "START"
};

/**
 * Formats a project's origination date for display in the list table.
 * @param {string | null | undefined} originationDate - ISO date string in YYYY-MM-DD format.
 * @returns {string} Formatted date in MM/DD/YYYY, or `TBD` when unavailable.
 */
export const formatProjectStartDate = (originationDate) => {
    if (!originationDate) {
        return "TBD";
    }

    return formatDate(new Date(originationDate + "T00:00:00Z"));
};

/**
 * Sorts projects for the list table based on the active sort condition and direction.
 * @param {import("../../../types/ProjectTypes").Project[]} projects - Project rows to sort.
 * @param {string | null} sortCondition - Active sort code.
 * @param {boolean} sortDescending - Whether to sort descending.
 * @returns {import("../../../types/ProjectTypes").Project[]} Sorted project rows.
 */
export const sortProjects = (projects, sortCondition, sortDescending) => {
    const sortedProjects = [...projects];

    sortedProjects.sort((left, right) => {
        switch (sortCondition) {
            case PROJECT_SORT_CODES.PROJECT:
                return left.title.localeCompare(right.title);
            case PROJECT_SORT_CODES.TYPE:
                return convertCodeForDisplay("project", left.project_type).localeCompare(
                    convertCodeForDisplay("project", right.project_type)
                );
            case PROJECT_SORT_CODES.START: {
                const leftDate = left.origination_date
                    ? new Date(left.origination_date + "T00:00:00Z").getTime()
                    : -Infinity;
                const rightDate = right.origination_date
                    ? new Date(right.origination_date + "T00:00:00Z").getTime()
                    : -Infinity;
                return leftDate - rightDate;
            }
            default:
                return 0;
        }
    });

    return sortDescending ? sortedProjects.reverse() : sortedProjects;
};
