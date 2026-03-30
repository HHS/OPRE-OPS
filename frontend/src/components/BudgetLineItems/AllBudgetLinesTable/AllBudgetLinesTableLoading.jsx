import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";
import { All_BUDGET_LINES_TABLE_HEADINGS_LIST } from "./AllBudgetLinesTable.constants";

const COLUMN_WIDTHS = ["45%", "75%", "45%", "35%", "50%", "40%", "55%", "60%", "45%"];

/**
 * Skeleton loading state for the all budget lines table.
 * @returns {React.ReactElement}
 */
const AllBudgetLinesTableLoading = () => (
    <TableLoadingSkeleton
        headings={All_BUDGET_LINES_TABLE_HEADINGS_LIST.map(({ heading }) => heading)}
        columnWidths={COLUMN_WIDTHS}
        ariaLabel="Loading budget lines"
    />
);

export default AllBudgetLinesTableLoading;
