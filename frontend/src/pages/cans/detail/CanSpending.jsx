import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import CANBudgetLineTable from "../../../components/CANs/CANBudgetLineTable";
import DebugCode from "../../../components/DebugCode";
import BigBudgetCard from "../../../components/UI/Cards/BudgetCard/BigBudgetCard";

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
    const { data: CANFunding, isLoading } = useGetCanFundingSummaryQuery({ id: canId, fiscalYear: fiscalYear });

    if (isLoading) return <div>Loading...</div>;
    if (!CANFunding) return <div>No data</div>;

    const { total_funding: totalFunding, planned_funding, obligated_funding, in_execution_funding } = CANFunding;
    const totalSpending = planned_funding + obligated_funding + in_execution_funding;

    return (
        <article>
            <h2>CAN Spending Summary</h2>
            <p>The summary below shows the CANs total budget and spending across all budget lines</p>
            <BigBudgetCard
                title={`FY ${fiscalYear} Available CAN Budget *`}
                totalSpending={totalSpending}
                totalFunding={totalFunding}
            />
            <h2>CAN Budget Lines</h2>
            <p>This is a list of all budget lines allocating funding from this CAN for the selected fiscal year.</p>
            <CANBudgetLineTable budgetLines={budgetLines} />
            <DebugCode data={CANFunding} />
        </article>
    );
};

export default CanSpending;
