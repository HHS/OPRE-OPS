import PropTypes from "prop-types";
import BudgetLinesTotalSummaryCard from "../BudgetLinesTotalSummaryCard";
import BLIStatusSummaryCard from "../BLIStatusSummaryCard";

/**
 * SummaryCardsSection component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {Object[]} props.budgetLines - The budget lines to render
 * @returns {JSX.Element} - The rendered component
 */
const SummaryCardsSection = ({ budgetLines }) => {
    return (
        <div className="display-flex flex-justify">
            <BLIStatusSummaryCard budgetLines={budgetLines} />
            <BudgetLinesTotalSummaryCard
                title="Budget Lines Total"
                budgetLines={budgetLines}
            />
        </div>
    );
};

SummaryCardsSection.propTypes = {
    budgetLines: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default SummaryCardsSection;
