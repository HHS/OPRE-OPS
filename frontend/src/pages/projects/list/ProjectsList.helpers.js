import { formatDate } from "../../../helpers/utils";

/**
 * Sort field codes for the projects list, matching the backend `ProjectSortCondition` enum.
 * @type {{TITLE: string, PROJECT_TYPE: string, PROJECT_START: string, PROJECT_END: string, FY_TOTAL: string, PROJECT_TOTAL: string}}
 */
export const PROJECT_SORT_CODES = {
    TITLE: "TITLE",
    PROJECT_TYPE: "PROJECT_TYPE",
    PROJECT_START: "PROJECT_START",
    PROJECT_END: "PROJECT_END",
    FY_TOTAL: "FY_TOTAL",
    PROJECT_TOTAL: "PROJECT_TOTAL"
};

/**
 * Formats an ISO date string (YYYY-MM-DD) for display in the list table.
 * @param {string | null | undefined} isoDate - ISO date string in YYYY-MM-DD format.
 * @returns {string} Formatted date in M/D/YYYY, or `TBD` when unavailable.
 */
export const formatProjectDate = (isoDate) => {
    if (!isoDate) {
        return "TBD";
    }

    return formatDate(new Date(isoDate + "T00:00:00Z"));
};
