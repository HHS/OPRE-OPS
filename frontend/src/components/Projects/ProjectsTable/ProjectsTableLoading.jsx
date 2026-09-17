import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";

const BASE_HEADINGS = ["Project", "Type", "Start", "End"];
const BASE_WIDTHS = ["75%", "55%", "50%", "50%"];
const FY_TOTAL_WIDTH = "60%";
const PROJECT_TOTAL_WIDTH = "65%";

/**
 * Skeleton loading state for the projects list table.
 * Mirrors ProjectsTable: FY Total column is hidden when selectedFiscalYear is "All".
 * @param {Object} props
 * @param {string} props.selectedFiscalYear - The currently selected fiscal year ("All" or a specific year).
 * @returns {React.ReactElement}
 */
const ProjectsTableLoading = ({ selectedFiscalYear }) => {
    const isAllFY = selectedFiscalYear === "All";
    const headings = [...BASE_HEADINGS, ...(isAllFY ? [] : ["FY Total"]), "Lifetime Total"];
    const columnWidths = [...BASE_WIDTHS, ...(isAllFY ? [] : [FY_TOTAL_WIDTH]), PROJECT_TOTAL_WIDTH];

    return (
        <TableLoadingSkeleton
            headings={headings}
            columnWidths={columnWidths}
            hasExpandableRows
            ariaLabel="Loading projects"
        />
    );
};

export default ProjectsTableLoading;
