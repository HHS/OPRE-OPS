import PropTypes from "prop-types";
import Table from "../../UI/Table";
import { CAN_TABLE_HEADINGS } from "./CANTable.constants";
import CANTableRow from "./CANTableRow";

/**
 * CANTable component of CanList
 * @component
 * @typedef {import("../../CANs/CANTypes").CAN} CAN
 * @param {Object} props
 * @param {CAN[]} props.cans - Array of CANs
 * @returns {JSX.Element}
 */
const CANTable = ({ cans }) => {
    if (cans.length === 0) {
        return <p className="text-center">No CANs found</p>;
    }
    return (
        <Table tableHeadings={CAN_TABLE_HEADINGS}>
            {cans.map((can) => (
                <CANTableRow
                    key={can.id}
                    canId={can.id}
                    name={can.display_name}
                    nickname={can.nick_name}
                    portfolio={can.portfolio.abbreviation}
                    FY={can.funding_budgets[0]?.fiscal_year ?? "TBD"}
                    activePeriod={can.active_period ?? "TBD"}
                    obligateBy={can.obligate_by ?? "09/30/25"}
                    transfer={can.funding_details.method_of_transfer ?? "TBD"}
                    fyBudget={can.funding_budgets[0]?.budget ?? 0}
                />
            ))}
        </Table>
    );
};

CANTable.propTypes = {
    cans: PropTypes.array.isRequired
};

export default CANTable;
