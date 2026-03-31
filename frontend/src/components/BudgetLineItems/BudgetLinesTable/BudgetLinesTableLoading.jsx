import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";
import { BUDGET_LINE_TABLE_HEADERS } from "./BudgetLinesTable.constants";

const COLUMN_WIDTHS = ["35%", "45%", "30%", "35%", "50%", "45%", "50%", "45%"];

/**
 * Skeleton loading state for grouped agreement budget lines.
 * @returns {React.ReactElement}
 */
const BudgetLinesTableLoading = () => (
    <TableLoadingSkeleton
        headings={BUDGET_LINE_TABLE_HEADERS.map(({ heading }) => heading)}
        columnWidths={COLUMN_WIDTHS}
        hasExpandableRows
        ariaLabel="Loading budget lines"
    />
);

export default BudgetLinesTableLoading;
