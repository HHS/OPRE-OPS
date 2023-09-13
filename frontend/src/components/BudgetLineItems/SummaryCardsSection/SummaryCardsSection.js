import PropTypes from "prop-types";
import RoundedBox from "../../UI/RoundedBox";
import CurrencyWithSmallCents from "../../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import { totalBudgetLineAmountPlusFees } from "../../../helpers/utils";

/**
 * BudgetLinesSummaryCard component
 * @param {Object} props - Properties passed to component
 * @param {string} props.title - The title of the card
 * @param {React.ReactNode} props.children - The children to render
 * @returns {React.JSX.Element} - The rendered component
 */
const BudgetLinesSummaryCard = ({ title, children }) => {
    return (
        <RoundedBox className="padding-y-205 padding-x-4 padding-right-9 display-inline-block">
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{title}</h3>
            {children}
        </RoundedBox>
    );
};
BudgetLinesSummaryCard.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

/**
 * BudgetLinesSummaryCard component
 * @param {Object} props - Properties passed to component
 * @param {string} props.title - The title of the card
 * @param {Object[]} props.budgetLines - The budget lines to render
 * @returns {React.JSX.Element} - The rendered component
 */
const BudgetLineTotalSummaryCard = ({ title, budgetLines }) => {
    const totalAmountWithFees = budgetLines.reduce((total, budgetLine) => {
        return total + totalBudgetLineAmountPlusFees(budgetLine.amount, budgetLine.psc_fee_amount);
    }, 0);
    return (
        <BudgetLinesSummaryCard title={title}>
            <CurrencyWithSmallCents
                amount={totalAmountWithFees}
                dollarsClasses="font-sans-xl text-bold margin-bottom-0"
                centsStyles={{ fontSize: "10px" }}
            />
        </BudgetLinesSummaryCard>
    );
};
BudgetLineTotalSummaryCard.propTypes = {
    title: PropTypes.string.isRequired,
    budgetLines: PropTypes.arrayOf(PropTypes.object).isRequired,
};

/**
 * SummaryCardsSection component
 * @param {Object} props - Properties passed to component
 * @param {Object[]} props.budgetLines - The budget lines to render
 * @returns {React.JSX.Element} - The rendered component
 */
const SummaryCardsSection = ({ budgetLines }) => {
    return (
        <div className="display-flex flex-justify">
            <BudgetLinesSummaryCard title="TODO: Replace me" />
            <BudgetLineTotalSummaryCard title="Budget Lines Total" budgetLines={budgetLines} />
        </div>
    );
};

SummaryCardsSection.propTypes = {
    budgetLines: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default SummaryCardsSection;
