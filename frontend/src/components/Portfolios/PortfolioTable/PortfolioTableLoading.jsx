import TableLoadingSkeleton from "../../UI/TableLoadingSkeleton";
import { PORTFOLIO_TABLE_HEADERS } from "./PortfolioTable.constants";

const COLUMN_WIDTHS = ["75%", "60%", "60%", "60%"];

/**
 * Skeleton loading state for the portfolio table.
 * @param {Object} props
 * @param {number} props.fiscalYear
 * @returns {React.ReactElement}
 */
const PortfolioTableLoading = ({ fiscalYear }) => {
    const fyShort = fiscalYear ? String(fiscalYear).slice(-2) : "";
    const headings = [
        PORTFOLIO_TABLE_HEADERS.PORTFOLIO_NAME,
        `FY ${fyShort} Budget`,
        `FY ${fyShort} Spending`,
        `FY ${fyShort} Available Budget`
    ];

    return (
        <TableLoadingSkeleton
            headings={headings}
            columnWidths={COLUMN_WIDTHS}
            ariaLabel="Loading portfolios"
        />
    );
};

export default PortfolioTableLoading;
