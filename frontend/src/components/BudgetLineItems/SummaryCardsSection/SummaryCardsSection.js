import PropTypes from "prop-types";
import SummaryCard from "../../UI/SummaryCard";
import BudgetLinesTotalSummaryCard from "../BudgetLinesTotalSummaryCard";

/**
 * SummaryCardsSection component
 * @param {Object} props - Properties passed to component
 * @param {Object[]} props.budgetLines - The budget lines to render
 * @returns {React.JSX.Element} - The rendered component
 */
const SummaryCardsSection = ({ budgetLines }) => {
    return (
        <div className="display-flex flex-justify">
            <SummaryCard title="TODO: Replace me">{null}</SummaryCard>
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
