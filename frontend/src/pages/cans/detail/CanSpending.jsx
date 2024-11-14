import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import CANBudgetLineTable from "../../../components/CANs/CANBudgetLineTable";
import BigBudgetCard from "../../../components/UI/Cards/BudgetCard/BigBudgetCard";
import DonutGraphWithLegendCard from "../../../components/UI/Cards/DonutGraphWithLegendCard";
import ProjectAgreementBLICard from "../../../components/UI/Cards/ProjectAgreementBLICard";
import { calculatePercent } from "../../../helpers/utils";

/**
 * @typedef ItemCount
 * @property {string} type
 * @property {number} count
 */

/**
    @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
    @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
*/

/**
 * @typedef {Object} CanSpendingProps
 * @property {BudgetLine[]} budgetLines
 * @property {number} fiscalYear
 * @property {number} canId
 * @property {ItemCount[]} [projects]
 * @property {ItemCount[]} [budgetLineTypesCount]
 * @property {ItemCount[]} [agreements]
 */

/**
 * @component - The CAN detail page.
 * @param {CanSpendingProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanSpending = ({ budgetLines, fiscalYear, canId, projects, budgetLineTypesCount, agreements }) => {
    const { data: CANFunding, isLoading } = useGetCanFundingSummaryQuery({ id: canId, fiscalYear: fiscalYear });

    if (isLoading) return <div>Loading...</div>;
    if (!CANFunding) return <div>No data</div>;

    const { total_funding: totalFunding, planned_funding, obligated_funding, in_execution_funding } = CANFunding;
    const totalSpending = Number(planned_funding) + Number(obligated_funding) + Number(in_execution_funding);
    const DRAFT_FUNDING = 1_000_000; // replace with actual data

    const graphData = [
        {
            id: 1,
            label: "Draft",
            value: Math.round(DRAFT_FUNDING) || 0,
            color: "var(--neutral-lighter)",
            percent: `${calculatePercent(DRAFT_FUNDING, totalFunding)}%`
        },
        {
            id: 2,
            label: "Planned",
            value: Math.round(planned_funding) || 0,
            color: "var(--data-viz-bl-by-status-2)",
            percent: `${calculatePercent(planned_funding, totalFunding)}%`
        },
        {
            id: 3,
            label: "Executing",
            value: Math.round(in_execution_funding) || 0,
            color: "var(--data-viz-bl-by-status-3)",
            percent: `${calculatePercent(in_execution_funding, totalFunding)}%`
        },
        {
            id: 4,
            label: "Obligated",
            value: Math.round(obligated_funding) || 0,
            color: "var(--data-viz-bl-by-status-4)",
            percent: `${calculatePercent(obligated_funding, totalFunding)}%`
        }
    ];

    return (
        <article>
            <h2>CAN Spending Summary</h2>
            <p>The summary below shows the CANs total budget and spending across all budget lines</p>
            <BigBudgetCard
                title={`FY ${fiscalYear} Available CAN Budget *`}
                totalSpending={totalSpending}
                totalFunding={totalFunding}
            />
            <div className="display-flex flex-justify margin-top-2">
                <ProjectAgreementBLICard
                    fiscalYear={fiscalYear}
                    projects={projects}
                    budgetLines={budgetLineTypesCount}
                    agreements={agreements}
                />
                <DonutGraphWithLegendCard
                    data={graphData}
                    title={`FY ${fiscalYear} Budget Lines by Status`}
                    totalFunding={totalFunding}
                />
            </div>
            <h2>CAN Budget Lines</h2>
            <p>This is a list of all budget lines allocating funding from this CAN for the selected fiscal year.</p>
            <CANBudgetLineTable
                budgetLines={budgetLines}
                totalFunding={totalFunding}
            />
        </article>
    );
};

export default CanSpending;
