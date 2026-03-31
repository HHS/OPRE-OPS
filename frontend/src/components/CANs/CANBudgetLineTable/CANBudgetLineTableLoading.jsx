import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";
import { CAN_HEADERS, PORTFOLIO_HEADERS } from "./CANBudgetLineTable.constants";

const COLUMN_WIDTHS = ["40%", "65%", "50%", "35%", "55%", "55%", "45%"];

/**
 * Skeleton loading state for CAN and portfolio budget line tables.
 * @param {Object} props
 * @param {'portfolio' | 'can'} [props.tableType]
 * @param {string} [props.ariaLabel]
 * @returns {React.ReactElement}
 */
const CANBudgetLineTableLoading = ({ tableType = "can", ariaLabel = "Loading budget lines" }) => {
    const headings = (tableType === "portfolio" ? PORTFOLIO_HEADERS : CAN_HEADERS).map(({ heading }) => heading);

    return (
        <TableLoadingSkeleton
            headings={headings}
            columnWidths={COLUMN_WIDTHS}
            hasExpandableRows
            ariaLabel={ariaLabel}
        />
    );
};

export default CANBudgetLineTableLoading;
