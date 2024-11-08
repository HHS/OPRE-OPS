import CANBudgetLineTable from "../../../components/CANs/CANBudgetLineTable";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import DebugCode from "../../../components/DebugCode";

/**
    @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
    @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
*/

/**
 * @typedef {Object} CanSpendingProps
 * @property {BudgetLine[]} budgetLines
 * @property {number} fiscalYear
 * @property {number} canId
 */

/**
 * @component - The CAN detail page.
 * @param {CanSpendingProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanSpending = ({ budgetLines, fiscalYear, canId }) => {
    // const { data: CANFunding } = useGetCanFundingSummaryQuery({
    //     id: canId,
    //     fiscalYear: fiscalYear
    // });
    const { data: CANFunding } = useGetCanFundingSummaryQuery({ id: canId, fiscalYear: fiscalYear });

    return (
        <article>
            <h2>CAN Spending Summary</h2>
            <p>The summary below shows the CANs total budget and spending across all budget lines</p>
            {/* Note: Cards go here */}
            <h2>CAN Budget Lines</h2>
            <p>This is a list of all budget lines allocating funding from this CAN for the selected fiscal year.</p>
            <CANBudgetLineTable budgetLines={budgetLines} />
            <DebugCode data={CANFunding} />
        </article>
    );
};

export default CanSpending;
