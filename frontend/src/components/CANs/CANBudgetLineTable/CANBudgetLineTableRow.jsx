/**
 * @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 */

import DebugCode from "../../DebugCode";

/**
 * @typedef {Object} CANBudgetLineTableRowProps
 * @property {BudgetLine} budgetLine
 */

/**
 * @component - The CAN Budget Line Table.
 * @param {CANBudgetLineTableRowProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetLineTableRow = ({ budgetLine }) => {
    return (
        <tr>
            <DebugCode data={budgetLine} />
        </tr>
    );
};

export default CANBudgetLineTableRow;
