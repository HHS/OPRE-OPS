import Card from "../../UI/Cards/Card";
import CurrencyWithSmallCents from "../../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";

/**
 * BudgetLineTotalSummaryCard component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.title - The title of the card
 * @param {number} props.totalAmount - The total amount of budget lines
 * @returns {JSX.Element} - The rendered component
 */
const BudgetLineTotalSummaryCard = ({ title, totalAmount }) => {
    return (
        <Card
            title={title}
            dataCy="bl-total-summary-card"
        >
            <CurrencyWithSmallCents
                amount={totalAmount}
                dollarsClasses="font-sans-xl text-bold margin-bottom-0"
                centsStyles={{ fontSize: "10px" }}
            />
        </Card>
    );
};

export default BudgetLineTotalSummaryCard;
