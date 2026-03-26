import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";
import { CAN_TABLE_HEADERS } from "./CANTable.constants";

const HEADINGS = [
    CAN_TABLE_HEADERS.CAN_NAME,
    CAN_TABLE_HEADERS.PORTFOLIO,
    CAN_TABLE_HEADERS.ACTIVE_PERIOD,
    CAN_TABLE_HEADERS.OBLIGATE_BY,
    CAN_TABLE_HEADERS.FY_BUDGET,
    CAN_TABLE_HEADERS.FUNDING_RECEIVED,
    CAN_TABLE_HEADERS.AVAILABLE_BUDGET
];

const COLUMN_WIDTHS = ["70%", "45%", "45%", "50%", "60%", "60%", "60%"];

/**
 * Skeleton loading state for the CAN list table.
 * @returns {React.ReactElement}
 */
const CANTableLoading = () => (
    <TableLoadingSkeleton
        headings={HEADINGS}
        columnWidths={COLUMN_WIDTHS}
        ariaLabel="Loading CANs"
    />
);

export default CANTableLoading;
