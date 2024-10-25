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
    const totalBudget = 1_000_000;
    const data = [
        {
            id: 1,
            label: "Previous FYs Carry-Forward",
            value: 100_000,
            color: "#A1D0BE",
            percent: `${calculatePercent(100_000, totalBudget)}%`,
            tagActiveStyle: "whiteOnTeal"
        },
        {
            id: 2,
            label: `FY ${fiscalYear} New Funding`,
            value: 900_000,
            color: "#534C9C",
            percent: `${calculatePercent(900_000, totalBudget)}%`,
            tagActiveStyle: "whiteOnPurple"
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
                title={`FY ${fiscalYear} CANs Available Budget *`}
                totalSpending={1_500_000}
                totalFunding={2_000_000}
            />
        </div>
    );
};

export default CANSummaryCards;
