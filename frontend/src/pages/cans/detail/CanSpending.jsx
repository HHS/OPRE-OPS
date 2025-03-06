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
 * @property {ItemCount[]} [projectTypesCount]
 * @property {ItemCount[]} [budgetLineTypesCount]
 * @property {ItemCount[]} [agreementTypesCount]
 * @property {number} plannedFunding
 * @property {number} inExecutionFunding
 * @property {number} inDraftFunding
 * @property {number} obligatedFunding
 * @property {number} totalFunding
 */

/**
 * @component - The CAN detail page.
 * @param {CanSpendingProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanSpending = ({
    budgetLines,
    fiscalYear,
    projectTypesCount,
    budgetLineTypesCount,
    agreementTypesCount,
    plannedFunding,
    inExecutionFunding,
    inDraftFunding,
    obligatedFunding,
    totalFunding
}) => {
    const totalSpending = Number(plannedFunding) + Number(obligatedFunding) + Number(inExecutionFunding);

    const graphData = [
        {
            id: 1,
            label: "Draft",
            value: Math.round(inDraftFunding) || 0,
            color: "var(--neutral-lighter)",
            percent: calculatePercent(inDraftFunding, totalFunding)
        },
        {
            id: 2,
            label: "Planned",
            value: Math.round(plannedFunding) || 0,
            color: "var(--data-viz-bl-by-status-2)",
            percent: calculatePercent(plannedFunding, totalFunding)
        },
        {
            id: 3,
            label: "Executing",
            value: Math.round(inExecutionFunding) || 0,
            color: "var(--data-viz-bl-by-status-3)",
            percent: calculatePercent(inExecutionFunding, totalFunding)
        },
        {
            id: 4,
            label: "Obligated",
            value: Math.round(obligatedFunding) || 0,
            color: "var(--data-viz-bl-by-status-4)",
            percent: calculatePercent(obligatedFunding, totalFunding)
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
                    projects={projectTypesCount}
                    budgetLines={budgetLineTypesCount}
                    agreements={agreementTypesCount}
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
                fiscalYear={fiscalYear}
            />
        </article>
    );
};

export default CanSpending;
