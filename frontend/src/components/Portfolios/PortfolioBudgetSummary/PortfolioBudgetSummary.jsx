import { calculatePercent } from "../../../helpers/utils";
import BigBudgetCard from "../../UI/Cards/BudgetCard/BigBudgetCard";
import ProjectAgreementBLICard from "../../UI/Cards/ProjectAgreementBLICard";
import DonutGraphWithLegendCard from "../../UI/Cards/DonutGraphWithLegendCard";

/**
 * @typedef {Object} PortfolioBudgetSummaryProps
 * @property {number} fiscalYear
 * @property {Object} portfolioFunding
 * @property {Object} portfolioFunding.total_funding
 * @property {number} portfolioFunding.total_funding.amount
 * @property {Object} portfolioFunding.in_execution_funding
 * @property {number} portfolioFunding.in_execution_funding.amount
 * @property {Object} portfolioFunding.obligated_funding
 * @property {number} portfolioFunding.obligated_funding.amount
 * @property {Object} portfolioFunding.planned_funding
 * @property {number} portfolioFunding.planned_funding.amount
 * @property {Array<import("../../UI/Cards/ProjectAgreementBLICard/ProjectAgreementBLICard").ItemCount>} projectTypesCount
 * @property {Array<import("../../UI/Cards/ProjectAgreementBLICard/ProjectAgreementBLICard").ItemCount>} budgetLineTypesCount
 */

/**
 * @component
 * @param {PortfolioBudgetSummaryProps} props
 * @returns {JSX.Element}
 */

const PortfolioBudgetSummary = ({ fiscalYear, portfolioFunding, projectTypesCount, budgetLineTypesCount }) => {
    const {
        total_funding: { amount: totalFunding },
        in_execution_funding: { amount: inExecutionFunding },
        obligated_funding: { amount: obligatedFunding },
        planned_funding: { amount: plannedFunding }
    } = portfolioFunding;

    const totalSpending = Number(plannedFunding) + Number(obligatedFunding) + Number(inExecutionFunding);
    
    // TODO: Implement these
    const inDraftFunding = 0;
    const agreementTypesCount = [];

    const graphData = [
        {
            id: 1,
            label: "Draft",
            value: Math.round(inDraftFunding) || 0,
            color: "var(--neutral-lighter)",
            percent: `${calculatePercent(inDraftFunding, totalFunding)}%`
        },
        {
            id: 2,
            label: "Planned",
            value: Math.round(plannedFunding) || 0,
            color: "var(--data-viz-bl-by-status-2)",
            percent: `${calculatePercent(plannedFunding, totalFunding)}%`
        },
        {
            id: 3,
            label: "Executing",
            value: Math.round(inExecutionFunding) || 0,
            color: "var(--data-viz-bl-by-status-3)",
            percent: `${calculatePercent(inExecutionFunding, totalFunding)}%`
        },
        {
            id: 4,
            label: "Obligated",
            value: Math.round(obligatedFunding) || 0,
            color: "var(--data-viz-bl-by-status-4)",
            percent: `${calculatePercent(obligatedFunding, totalFunding)}%`
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
                    totalFunding={totalFunding}
                />
            </div>
        </section>
    );
};

export default PortfolioBudgetSummary;
