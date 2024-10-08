import PropTypes from "prop-types";
import React from "react";
import PaginationNav from "../../UI/PaginationNav";
import CANTableHead from "./CANTableHead";
import CANTableRow from "./CANTableRow";
import styles from "./style.module.css";
import { formatObligateBy } from "./CANTable.helpers";

/**
 * CANTable component of CanList
 * @component
 * @typedef {import("../CANTypes").CAN} CAN
 * @param {Object} props
 * @param {CAN[]} props.cans - Array of CANs
 * @returns {JSX.Element}
 */
const CANTable = ({ cans }) => {
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
                            name={can.display_name ?? "TBD"}
                            nickname={can.nick_name ?? "TBD"}
                            portfolio={can.portfolio.abbreviation}
                            fiscalYear={can.funding_budgets[0]?.fiscal_year ?? "TBD"}
                            activePeriod={can.active_period ?? 0}
                            obligateBy={formatObligateBy(can.obligate_by)}
                            transfer={can.funding_details.method_of_transfer ?? "TBD"}
                            fyBudget={can.funding_budgets[0]?.budget ?? 0}
                        />
                    ))}
                </tbody>
            </table>
            {cans.length > 0 && (
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
    cans: PropTypes.array.isRequired
};

export default CANTable;
