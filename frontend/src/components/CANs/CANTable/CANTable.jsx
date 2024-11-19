import PropTypes from "prop-types";
import React from "react";
import { NO_DATA } from "../../../constants";
import PaginationNav from "../../UI/PaginationNav";
import { findFundingBudgetBudgetByFiscalYear, formatObligateBy } from "./CANTable.helpers";
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
    // TODO: once in prod, change this to 25
    const CANS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = React.useState(1);
    let cansPerPage = [...cans];
    cansPerPage = cansPerPage.slice((currentPage - 1) * CANS_PER_PAGE, currentPage * CANS_PER_PAGE);

    if (cans.length === 0) {
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
                            name={can.display_name ?? NO_DATA}
                            nickname={can.nick_name ?? NO_DATA}
                            portfolio={can.portfolio.abbreviation}
                            fiscalYear={can.funding_details?.fiscal_year ?? NO_DATA}
                            activePeriod={can.active_period ?? 0}
                            obligateBy={formatObligateBy(can.obligate_by)}
                            transfer={can.funding_details?.method_of_transfer ?? NO_DATA}
                            fyBudget={findFundingBudgetBudgetByFiscalYear(can, fiscalYear)}
                        />
                    ))}
                </tbody>
            </table>
            {cans.length > CANS_PER_PAGE && (
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
