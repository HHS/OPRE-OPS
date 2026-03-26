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
 * @param {string|number} selectedFiscalYear - Current selected fiscal year or "All"
 * @param {string} sortCondition - Current sort field
 * @param {boolean} sortDescending - Current sort direction
 * @param {number} totalCount - Total number of projects
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
    totalCount
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
                    sortConditions: sortCondition,
                    sortDescending,
                    page,
                    limit: maxLimit,
                    fiscalYear: selectedFiscalYear
                }).unwrap()
            );
        }

        const allResponses = await Promise.all(fetchPromises);
        const allProjects = allResponses.flatMap((response) => response?.projects || []);

        const isSpecificFY = selectedFiscalYear && selectedFiscalYear !== "All";
        const fyLabel = isSpecificFY ? `FY${String(selectedFiscalYear).slice(-2)} Total` : "FY Total";

        const tableHeaders = [
            "Project",
            "Type",
            "Start Date",
            "End Date",
            fyLabel,
            "Project Total",
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
                    isSpecificFY && project.fiscal_year_totals
                        ? project.fiscal_year_totals[Number(selectedFiscalYear)]
                        : null;
                const fyTotal = rawFyTotal != null ? Number(rawFyTotal) : "";
                const projectTotal =
                    project.project_total != null && Number(project.project_total) > 0
                        ? Number(project.project_total)
                        : "";
                const agreementList = project.agreement_name_list ?? [];
                const totalAgreements = agreementList.length;
                const agreementNames = agreementList.map((a) => a.name).join(", ");

                return [title, type, startDate, endDate, fyTotal, projectTotal, totalAgreements, agreementNames];
            },
            filename: isSpecificFY ? `projects_FY${selectedFiscalYear}` : "projects_all",
            currencyColumns: [4, 5]
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
