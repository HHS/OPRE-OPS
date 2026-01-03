import { sortPortfolios } from "./PortfolioTable.helpers";
import PortfolioTableHead from "./PortfolioTableHead";
import PortfolioTableRow from "./PortfolioTableRow";
import styles from "./style.module.css";

/**
 * PortfolioTable component - displays portfolios with funding data in a table
 * @component
 * @typedef {import("../../../types/PortfolioTypes").Portfolio} Portfolio
 * @param {Object} props
 * @param {Portfolio[]} props.portfolios - Array of portfolios with funding data already attached
 * @param {number} props.fiscalYear - Fiscal year to filter by
 * @param {string} props.sortConditions - The condition to sort the table on
 * @param {boolean} props.sortDescending - Whether the table should be sorted descending or not
 * @param {function} props.setSortConditions - The function responsible for updating the sort condition and direction
 * @returns {JSX.Element}
 */
const PortfolioTable = ({ portfolios, fiscalYear, sortConditions, sortDescending, setSortConditions }) => {
    // Show empty state
    if (portfolios.length === 0) {
        return <p className="text-center">No portfolios found</p>;
    }

    // Sort the data
    const sortedData = sortPortfolios(portfolios, sortConditions, sortDescending);

    return (
        <table className={`usa-table usa-table--borderless width-full ${styles.tableHover}`}>
            <PortfolioTableHead
                onClickHeader={setSortConditions}
                selectedHeader={sortConditions}
                sortDescending={sortDescending}
                fiscalYear={fiscalYear}
            />
            <tbody>
                {sortedData.map((portfolio) => (
                    <PortfolioTableRow
                        key={portfolio.id}
                        portfolio={portfolio}
                    />
                ))}
            </tbody>
        </table>
    );
};

export default PortfolioTable;
