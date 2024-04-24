import PropTypes from "prop-types";
import CurrencyWithSmallCents from "../../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import { totalBudgetLineAmountPlusFees, totalBudgetLineFeeAmount } from "../../../helpers/utils";
import SummaryCard from "../../UI/SummaryCard";

const calculateTotalAmountWithFees = (budgetLines) => {
    return budgetLines.reduce((total, budgetLine) => {
        return (
            total +
            totalBudgetLineAmountPlusFees(
                budgetLine.amount,
                totalBudgetLineFeeAmount(budgetLine.amount, budgetLine.proc_shop_fee_percentage)
            )
        );
    }, 0);
};

/**
 * BudgetLineTotalSummaryCard component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.title - The title of the card
 * @param {Object[]} props.budgetLines - The budget lines to render
 * @returns {JSX.Element} - The rendered component
 */
const BudgetLineTotalSummaryCard = ({ title, budgetLines }) => {
    const totalAmountWithFees = calculateTotalAmountWithFees(budgetLines);
    return (
        <SummaryCard
            title={title}
            dataCy="bl-total-summary-card"
        >
            <CurrencyWithSmallCents
                amount={totalAmountWithFees}
                dollarsClasses="font-sans-xl text-bold margin-bottom-0"
                centsStyles={{ fontSize: "10px" }}
            />
        </SummaryCard>
    );
};

BudgetLineTotalSummaryCard.propTypes = {
    title: PropTypes.string.isRequired,
    budgetLines: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default BudgetLineTotalSummaryCard;
