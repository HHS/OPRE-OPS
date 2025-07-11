import BudgetLinesTotalSummaryCard from "../BudgetLinesTotalSummaryCard";
import BLIStatusSummaryCard from "../BLIStatusSummaryCard";

/**
 * SummaryCardsSection component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.totalAmount - The total amount of budget lines
 * @param {number} props.totalDraftAmount - the total amount of draft budget lines
 * @param {number} props.totalPlannedAmount - The total amount of planned budget lines
 * @param {number} props.totalExecutingAmount - The total amount of in execution budget lines
 * @param {number} props.totalObligatedAmount - The total amount of obligated budget lines
 * @param {number} props.totalOvercomeByEventsAmount - The total amount of budget lines overcome by events
 * @returns {JSX.Element} - The rendered component
 */
const SummaryCardsSection = ({
    totalAmount,
    totalDraftAmount,
    totalPlannedAmount,
    totalExecutingAmount,
    totalObligatedAmount,
}) => {
    return (
        <div className="display-flex flex-justify">
            <BudgetLinesTotalSummaryCard
                title="Budget Lines Total"
                totalAmount={totalAmount}
            />
            <BLIStatusSummaryCard
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
