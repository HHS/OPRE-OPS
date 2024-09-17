import Table from "../../UI/Table";
import { CAN_TABLE_HEADINGS } from "./CANTable.constants";
import CANTableRow from "./CANTableRow";

const CANTable = ({ cans }) => {
    return (
        <Table tableHeadings={CAN_TABLE_HEADINGS}>
            {cans.map((can) => (
                <CANTableRow
                    key={can.id}
                    canId={can.id}
                    can={can.display_name}
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

export default CANTable;
