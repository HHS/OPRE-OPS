import { calculatePercent } from "../../../helpers/utils";
import BigBudgetCard from "../../UI/Cards/BudgetCard/BigBudgetCard";
import DonutGraphWithLegendCard from "../../UI/Cards/DonutGraphWithLegendCard";
import ProjectAgreementBLICard from "../../UI/Cards/ProjectAgreementBLICard";

/**
 * @typedef {Object} PortfolioBudgetSummaryProps
 * @property {number} fiscalYear
 * @property {number} totalFunding
 * @property {number} inExecutionFunding
 * @property {number} obligatedFunding
 * @property {number} plannedFunding
 * @property {number} inDraftFunding
 * @property {Array<import("../../UI/Cards/ProjectAgreementBLICard/ProjectAgreementBLICard").ItemCount>} projectTypesCount
 * @property {Array<import("../../UI/Cards/ProjectAgreementBLICard/ProjectAgreementBLICard").ItemCount>} budgetLineTypesCount
 * @property {Array<import("../../UI/Cards/ProjectAgreementBLICard/ProjectAgreementBLICard").ItemCount>} agreementTypesCount
 */

/**
 * @component
 * @param {PortfolioBudgetSummaryProps} props
 * @returns {JSX.Element}
 */

const PortfolioBudgetSummary = ({
    fiscalYear,
    projectTypesCount,
    budgetLineTypesCount,
    agreementTypesCount,
    inDraftFunding,
    totalFunding,
    inExecutionFunding,
    obligatedFunding,
    plannedFunding
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
        <section>
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
                />
            </div>
        </section>
    );
};

export default PortfolioBudgetSummary;
