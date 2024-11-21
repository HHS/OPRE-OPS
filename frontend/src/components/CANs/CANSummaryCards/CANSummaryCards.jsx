import { calculatePercent } from "../../../helpers/utils";
import BudgetCard from "../../UI/Cards/BudgetCard";
import LineGraphWithLegendCard from "../../UI/Cards/LineGraphWithLegendCard";

/**
 * @typedef {Object} CANSummaryCardsProps
 * @property {number} fiscalYear - The fiscal year.
 */

/**
 * @component CANSummaryCards - Wraps the LineGraphWithLegend and BudgetCard components.
 * @param {CANSummaryCardsProps} props
 * @returns {JSX.Element} - The CANSummaryCards component.
 */
const CANSummaryCards = ({ fiscalYear }) => {
    const totalSpending = 42_650_000;
    const totalBudget = 56_000_000;
    const newFunding = 41_000_000;
    const carryForward = 15_000_000;
    const data = [
        {
            id: 1,
            label: "Previous FYs Carry-Forward",
            value: carryForward,
            color: "var(--feedback-info)",
            percent: `${calculatePercent(carryForward, totalBudget)}%`,
            tagActiveStyle: "darkTextOnLightBlue"
        },
        {
            id: 2,
            label: `FY ${fiscalYear} New Funding`,
            value: newFunding,
            color: "var(--can-total-budget-2)",
            percent: `${calculatePercent(newFunding, totalBudget)}%`,
            tagActiveStyle: "lightTextOnDarkBlue"
        }
    ];
    return (
        <div className="display-flex flex-justify">
            <LineGraphWithLegendCard
                heading={`FY ${fiscalYear} CANs Total Budget`}
                data={data}
                bigNumber={totalBudget}
            />
            <BudgetCard
                cardId={fiscalYear}
                title={`FY ${fiscalYear} CANs Available Budget *`}
                totalSpending={totalSpending}
                totalFunding={totalBudget}
            />
        </div>
    );
};

export default CANSummaryCards;
