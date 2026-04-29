import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";
import { COLUMN_WIDTHS, getTableHeadings } from "./ProjectFundingCANsTable.constants";

/**
 * Skeleton loading state for the Project Funding by CAN table.
 * Preserves column headers (including dynamic FY label) so layout
 * does not shift when real data arrives.
 *
 * @component
 * @param {Object} props
 * @param {number} props.fiscalYear - Selected fiscal year (drives dynamic column header)
 * @returns {JSX.Element}
 */
const ProjectFundingCANsTableLoading = ({ fiscalYear }) => (
    <TableLoadingSkeleton
        headings={getTableHeadings(fiscalYear)}
        columnWidths={COLUMN_WIDTHS}
        ariaLabel="Loading project funding CANs"
    />
);

export default ProjectFundingCANsTableLoading;
