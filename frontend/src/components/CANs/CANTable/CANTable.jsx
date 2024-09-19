import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import PaginationNav from "../../UI/PaginationNav";
import Tooltip from "../../UI/USWDS/Tooltip";
import CANTableRow from "./CANTableRow";
import styles from "./style.module.css";
/**
 * CANTable component of CanList
 * @component
 * @typedef {import("../../CANs/CANTypes").CAN} CAN
 * @param {Object} props
 * @param {CAN[]} props.cans - Array of CANs
 * @returns {JSX.Element}
 */
const CANTable = ({ cans }) => {
    const CANS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = React.useState(1);
    let cansPerPage = _.cloneDeep(cans);
    cansPerPage = cansPerPage.slice((currentPage - 1) * CANS_PER_PAGE, currentPage * CANS_PER_PAGE);

    if (cans.length === 0) {
        return <p className="text-center">No CANs found</p>;
    }

    return (
        <>
            <table className={`usa-table usa-table--borderless width-full ${styles.tableHover}`}>
                <TableHead />
                <tbody>
                    {cansPerPage.map((can) => (
                        <CANTableRow
                            key={can.id}
                            canId={can.id}
                            name={can.display_name}
                            nickname={can.nick_name}
                            portfolio={can.portfolio.abbreviation}
                            fiscalYear={can.funding_budgets[0]?.fiscal_year ?? "TBD"}
                            activePeriod={can.active_period ?? "TBD"}
                            obligateBy={can.obligate_by ?? "09/30/25"}
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

const TableHead = () => {
    const availbleTooltip =
        "$ Available is the remaining amount of the total budget that is available to plan from (Total FY Budget minus budget lines in Planned, Executing or Obligated Status)";
    return (
        <thead>
            <tr>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    CAN
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    Portfolio
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    FY
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    Active Period
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    Obligate By
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    Transfer
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    FY Budget
                </th>
                <th
                    scope="col"
                    style={{ whiteSpace: "nowrap" }}
                >
                    <Tooltip label={availbleTooltip}>
                        <span>$ Available</span>
                    </Tooltip>
                </th>
            </tr>
        </thead>
    );
};

CANTable.propTypes = {
    cans: PropTypes.array.isRequired
};

export default CANTable;
