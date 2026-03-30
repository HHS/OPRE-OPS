import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";

const HEADINGS = ["Project", "Type", "Start", "End", "FY Total", "Project Total"];
const COLUMN_WIDTHS = ["75%", "55%", "50%", "50%", "60%", "65%"];

/**
 * Skeleton loading state for the projects list table.
 * Thin wrapper over TableLoadingSkeleton with project-specific column config.
 * @returns {React.ReactElement}
 */
const ProjectsTableLoading = () => (
    <TableLoadingSkeleton
        headings={HEADINGS}
        columnWidths={COLUMN_WIDTHS}
        hasExpandableRows
        ariaLabel="Loading projects"
    />
);

export default ProjectsTableLoading;
