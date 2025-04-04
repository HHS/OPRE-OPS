import BudgetLinesTotalSummaryCard from "../BudgetLinesTotalSummaryCard";
import BLIStatusSummaryCard from "../BLIStatusSummaryCard";

/**
 * SummaryCardsSection component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {Object[]} props.budgetLines - The budget lines to render
 * @param {number} props.totalAmount - The total amount of budget lines
 * @param {number} props.totalDraftAmount - the total amount of draft budget lines
 * @param {number} props.totalPlannedAmount - The total amount of planned budget lines
 * @param {number} props.totalExecutingAmount - The total amount of in execution budget lines
 * @param {number} props.totalObligatedAmount - The total amount of obligated budget lines
 * @returns {JSX.Element} - The rendered component
 */
const SummaryCardsSection = ({
    budgetLines,
    totalAmount,
    totalDraftAmount,
    totalPlannedAmount,
    totalExecutingAmount,
    totalObligatedAmount
}) => {
    return (
        <div className="display-flex flex-justify">
            <BudgetLinesTotalSummaryCard
                title="Budget Lines Total"
                budgetLines={budgetLines}
                totalAmount={totalAmount}
            />
            <BLIStatusSummaryCard
                budgetLines={budgetLines}
                totalDraftAmount={totalDraftAmount}
                totalPlannedAmount={totalPlannedAmount}
                totalExecutingAmount={totalExecutingAmount}
                totalObligatedAmount={totalObligatedAmount}
                totalAmount={totalAmount}
            />
        </div>
    );
};

export default SummaryCardsSection;
