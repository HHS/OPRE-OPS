import BudgetSummaryCard from "../../UI/SummaryCard/BudgetSummaryCard";

/**
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.fiscalYear - The fiscal year.
 * @returns {JSX.Element} - The CANSummaryCards component.
 */
const CANSummaryCards = ({ fiscalYear }) => {
    return (
        <div className="display-flex flex-justify">
            <p> Summary Cards Left</p>
            <BudgetSummaryCard
                title={`FY ${fiscalYear} CANs Available Budget *`}
                totalSpending={1_500_000}
                totalFunding={2_000_000}
            />
        </div>
    );
};

export default CANSummaryCards;
