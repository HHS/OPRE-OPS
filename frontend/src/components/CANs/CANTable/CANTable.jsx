import PropTypes from "prop-types";
import React from "react";
import PaginationNav from "../../UI/PaginationNav";
import {
    formatObligateBy,
    findFundingBudgetBudgetByFiscalYear,
    findFundingBudgetFYByFiscalYear
} from "./CANTable.helpers";
import CANTableHead from "./CANTableHead";
import CANTableRow from "./CANTableRow";
import styles from "./style.module.css";

/**
 * CANTable component of CanList
 * @component
 * @typedef {import("../CANTypes").CAN} CAN
 * @param {Object} props
 * @param {CAN[]} props.cans - Array of CANs
 * @param {number} props.fiscalYear - Fiscal year to filter by
 * @returns {JSX.Element}
 */
const CANTable = ({ cans, fiscalYear }) => {
    // Filter CANs by fiscal year
    const filteredCANsByFiscalYear = React.useMemo(() => {
        if (!fiscalYear) return cans;
        return cans.filter((can) => can.funding_budgets.some((budget) => budget.fiscal_year === fiscalYear));
    }, [cans, fiscalYear]);
    // TODO: once in prod, change this to 25
    const CANS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = React.useState(1);
    let cansPerPage = [...filteredCANsByFiscalYear];
    cansPerPage = cansPerPage.slice((currentPage - 1) * CANS_PER_PAGE, currentPage * CANS_PER_PAGE);

    if (cansPerPage.length === 0) {
        return <p className="text-center">No CANs found</p>;
    }

    return (
        <>
            <table className={`usa-table usa-table--borderless width-full ${styles.tableHover}`}>
                <CANTableHead />
                <tbody>
                    {cansPerPage.map((can) => (
                        <CANTableRow
                            key={can.id}
                            canId={can.id}
                            name={can.display_name ?? "TBD"}
                            nickname={can.nick_name ?? "TBD"}
                            portfolio={can.portfolio.abbreviation}
                            fiscalYear={findFundingBudgetFYByFiscalYear(can, fiscalYear)}
                            activePeriod={can.active_period ?? 0}
                            obligateBy={formatObligateBy(can.obligate_by)}
                            transfer={can.funding_details.method_of_transfer ?? "TBD"}
                            fyBudget={findFundingBudgetBudgetByFiscalYear(can, fiscalYear)}
                        />
                    ))}
                </tbody>
            </table>
            {filteredCANsByFiscalYear.length > CANS_PER_PAGE && (
                <PaginationNav
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    items={cans}
                    itemsPerPage={CANS_PER_PAGE}
                />
            )}
        </>
    );
};

CANTable.propTypes = {
    cans: PropTypes.array.isRequired,
    fiscalYear: PropTypes.number
};

export default CANTable;
