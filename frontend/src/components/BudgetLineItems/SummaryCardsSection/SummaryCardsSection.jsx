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
 * @param {string|number} props.fiscalYear - The selected fiscal year
 * @returns {React.ReactElement} - The rendered component
 */
const SummaryCardsSection = ({
    totalAmount,
    totalDraftAmount,
    totalPlannedAmount,
    totalExecutingAmount,
    totalObligatedAmount,
    fiscalYear
}) => {
    const titlePrefix = fiscalYear === "Multi" ? "Multiple Years" : `FY ${fiscalYear}`;
    return (
        <div className="display-flex flex-justify">
            <BudgetLinesTotalSummaryCard
                title={`${titlePrefix} Budget Lines Total`}
                totalAmount={totalAmount}
            />
            <BLIStatusSummaryCard
                totalDraftAmount={totalDraftAmount}
                totalPlannedAmount={totalPlannedAmount}
                totalExecutingAmount={totalExecutingAmount}
                totalObligatedAmount={totalObligatedAmount}
                totalAmount={totalAmount}
                titlePrefix={titlePrefix}
            />
        </div>
    );
};

export default SummaryCardsSection;
