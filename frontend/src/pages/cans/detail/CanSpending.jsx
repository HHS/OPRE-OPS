import DebugCode from "../../../components/DebugCode";
/**
    @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
    @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
*/

/**
 * @typedef {Object} CanSpendingProps
 * @property {BudgetLine[]} budgetLines
 */

/**
 * @component - The CAN detail page.
 * @param {CanSpendingProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanSpending = ({ budgetLines }) => {
    return (
        <article>
            <h2>Can Spending</h2>
            <DebugCode data={budgetLines} />
        </article>
    );
};

export default CanSpending;
