import { formatDateNeeded } from "../../../helpers/utils";
import Table from "../../UI/Table";
import { TABLE_HEADERS } from "./CABBudgetLineTable.constants";
import CANBudgetLineTableRow from "./CANBudgetLineTableRow";
/**
 * @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 */

/**
 * @typedef {Object} CANBudgetLineTableProps
 * @property {BudgetLine[]} budgetLines
 */

/**
 * @component - The CAN Budget Line Table.
 * @param {CANBudgetLineTableProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetLineTable = ({ budgetLines }) => {
    if (budgetLines.length === 0) {
        return <p className="text-center">No budget lines have been added to this CAN.</p>;
    }

    return (
        <Table tableHeadings={TABLE_HEADERS}>
            {budgetLines.map((budgetLine) => (
                <CANBudgetLineTableRow
                    key={budgetLine.id}
                    blId={budgetLine.id}
                    agreementName="TBD"
                    obligateDate={formatDateNeeded(budgetLine.date_needed || "")}
                    fiscalYear={budgetLine.fiscal_year || "TBD"}
                    amount={budgetLine.amount || 0}
                    fee={budgetLine.proc_shop_fee_percentage}
                    percentOfCAN={3}
                    status={budgetLine.status}
                />
            ))}
        </Table>
    );
};

export default CANBudgetLineTable;
