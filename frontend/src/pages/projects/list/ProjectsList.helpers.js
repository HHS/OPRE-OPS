import { convertCodeForDisplay, formatDate } from "../../../helpers/utils";

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

/**
 * Handles exporting project data to Excel format, fetching all pages.
 * @param {Function} exportTableToXlsx - Export helper function
 * @param {Function} setIsExporting - State setter for export loading state
 * @param {Function} setAlert - Function to display user-facing alerts
 * @param {Function} getAllProjectsTrigger - Lazy query trigger for fetching projects
 * @param {string|number} selectedFiscalYear - Display-collapsed fiscal year ("All" or a year string; "Multi" already collapsed to "All" by the caller)
 * @param {string} sortCondition - Current sort field
 * @param {boolean} sortDescending - Current sort direction
 * @param {number} totalCount - Total number of projects
 * @param {import('./ProjectFilterButton/ProjectFilterTypes').Filters} filters - The resolved filters (fiscalYear already resolved via resolveForAPI), so export respects the same portfolio/search/type filters as the live query
 * @returns {Promise<void>}
 */
export const handleProjectsExport = async (
    exportTableToXlsx,
    setIsExporting,
    setAlert,
    getAllProjectsTrigger,
    selectedFiscalYear,
    sortCondition,
    sortDescending,
    totalCount,
    filters
) => {
    try {
        setIsExporting(true);

        // Backend max page size is 50
        const maxLimit = 50;
        const totalPages = Math.ceil(totalCount / maxLimit);
        const fetchPromises = [];

        for (let page = 0; page < totalPages; page++) {
            fetchPromises.push(
                getAllProjectsTrigger({
                    filters,
                    sortConditions: sortCondition,
                    sortDescending,
                    page,
                    limit: maxLimit
                }).unwrap()
            );
        }

        const allResponses = await Promise.all(fetchPromises);
        const allProjects = allResponses.flatMap((response) => response?.projects || []);

        const isAllFY = selectedFiscalYear === "All";

        // FY Total column is omitted from the export when All FYs is selected — it has no
        // meaningful per-FY value and Project Total already covers the all-time figure.
        const tableHeaders = [
            "Project",
            "Type",
            "Start Date",
            "End Date",
            ...(isAllFY ? [] : [`FY${String(selectedFiscalYear).slice(-2)} Total`]),
            "Lifetime Total",
            "Total Agreements",
            "Agreements"
        ];

        await exportTableToXlsx({
            data: allProjects,
            headers: tableHeaders,
            rowMapper: (project) => {
                const title = project.title || "";
                const type = convertCodeForDisplay("project", project.project_type);
                const startDate = formatProjectDate(project.start_date);
                const endDate = formatProjectDate(project.end_date);
                const rawFyTotal =
                    !isAllFY && project.fiscal_year_totals
                        ? project.fiscal_year_totals[Number(selectedFiscalYear)]
                        : null;
                const fyTotal = rawFyTotal != null ? Number(rawFyTotal) : "";
                // project_total is always numeric (0 or positive); null only if field missing
                const projectTotal = project.project_total != null ? Number(project.project_total) : "";
                const agreementList = project.agreement_name_list ?? [];
                const totalAgreements = agreementList.length;
                const agreementNames = agreementList.map((a) => a.name).join(", ");

                return [
                    title,
                    type,
                    startDate,
                    endDate,
                    ...(isAllFY ? [] : [fyTotal]),
                    projectTotal,
                    totalAgreements,
                    agreementNames
                ];
            },
            filename: isAllFY ? "projects_all" : `projects_FY${selectedFiscalYear}`,
            // Project Total is at index 4 under All FYs (FY Total column absent), index 5 with specific FY
            currencyColumns: isAllFY ? [4] : [4, 5]
        });
    } catch (error) {
        console.error("Failed to export project data:", error);
        setAlert({
            type: "error",
            heading: "Export Failed",
            message: "An error occurred while exporting project data. Please try again.",
            redirectUrl: "/error"
        });
    } finally {
        setIsExporting(false);
    }
};
