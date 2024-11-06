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
                    budgetLine={budgetLine}
                />
            ))}
        </Table>
    );
};

export default CANBudgetLineTable;
