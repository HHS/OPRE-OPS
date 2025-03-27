import React, { useEffect } from "react";
import { NO_DATA } from "../../../constants";
import PaginationNav from "../../UI/PaginationNav";
import { formatObligateBy } from "./CANTable.helpers";
import CANTableHead from "./CANTableHead";
import CANTableRow from "./CANTableRow";
import styles from "./style.module.css";
import { useSetSortConditions } from "../../UI/Table/Table.hooks";

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
    const CANS_PER_PAGE = import.meta.env.MODE === "production" ? 25 : 10;
    const [currentPage, setCurrentPage] = React.useState(1);
    let cansPerPage = [...cans];
    cansPerPage = cansPerPage.slice((currentPage - 1) * CANS_PER_PAGE, currentPage * CANS_PER_PAGE);
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();
    useEffect(() => {
        setCurrentPage(1);
    }, [fiscalYear, cans]);

    if (cans.length === 0) {
        return <p className="text-center">No CANs found</p>;
    }

    return (
        <>
            <table className={`usa-table usa-table--borderless width-full ${styles.tableHover}`}>
                <CANTableHead onClickHeader={setSortConditions} selectedHeader={sortCondition} sortDescending={sortDescending}/>
                <tbody>
                    {cansPerPage.map((can) => (
                        <CANTableRow
                            key={can.id}
                            canId={can.id}
                            name={can.display_name ?? NO_DATA}
                            nickname={can.nick_name ?? NO_DATA}
                            portfolio={can.portfolio.abbreviation}
                            fiscalYear={fiscalYear}
                            activePeriod={can.active_period ?? 0}
                            obligateBy={formatObligateBy(can.obligate_by)}
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

export default CANTable;
