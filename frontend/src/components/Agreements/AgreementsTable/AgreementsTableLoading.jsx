import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import { getTableHeadingsWithFY } from "./AgreementsTable.constants";

const COLUMN_WIDTHS = ["75%", "50%", "45%", "45%", "60%", "60%"];

/**
 * Skeleton loading state for the agreements list table.
 * @param {Object} props
 * @param {string} props.selectedFiscalYear
 * @returns {React.ReactElement}
 */
const AgreementsTableLoading = ({ selectedFiscalYear }) => {
    const headings = getTableHeadingsWithFY(selectedFiscalYear, getCurrentFiscalYear()).map(({ heading }) => heading);

    return (
        <TableLoadingSkeleton
            headings={headings}
            columnWidths={COLUMN_WIDTHS}
            ariaLabel="Loading agreements"
        />
    );
};

export default AgreementsTableLoading;
