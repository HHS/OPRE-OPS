import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";
import { getTableHeadings } from "./ProjectSpendingAgreementsTable.constants";

const COLUMN_WIDTHS = ["70%", "55%", "50%", "50%", "60%", "65%"];

/**
 * Skeleton loading state for the Project Spending Agreements table.
 * Thin wrapper over TableLoadingSkeleton with project-spending-specific column config.
 *
 * @param {Object} props
 * @param {number} props.fiscalYear - The currently selected fiscal year (used for the dynamic FY column header).
 * @returns {React.ReactElement}
 */
const ProjectSpendingAgreementsTableLoading = ({ fiscalYear }) => (
    <TableLoadingSkeleton
        headings={getTableHeadings(fiscalYear)}
        columnWidths={COLUMN_WIDTHS}
        hasExpandableRows
        ariaLabel="Loading agreements"
    />
);

export default ProjectSpendingAgreementsTableLoading;
