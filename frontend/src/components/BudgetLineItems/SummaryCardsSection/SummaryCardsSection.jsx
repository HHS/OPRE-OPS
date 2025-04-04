import BudgetLinesTotalSummaryCard from "../BudgetLinesTotalSummaryCard";
import BLIStatusSummaryCard from "../BLIStatusSummaryCard";

/**
 * SummaryCardsSection component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {Object[]} props.budgetLines - The budget lines to render
 * @param {number} props.totalAmount - The total amount of budget lines
 * @returns {JSX.Element} - The rendered component
 */
const SummaryCardsSection = ({ budgetLines, totalAmount, totalDraftAmount }) => {
    return (
        <div className="display-flex flex-justify">
            <BudgetLinesTotalSummaryCard
                title="Budget Lines Total"
                budgetLines={budgetLines}
                totalAmount={totalAmount}
            />
            <BLIStatusSummaryCard budgetLines={budgetLines} totalDraftAmount={totalDraftAmount} totalAmount={totalAmount} />
        </div>
    );
};

export default SummaryCardsSection;
