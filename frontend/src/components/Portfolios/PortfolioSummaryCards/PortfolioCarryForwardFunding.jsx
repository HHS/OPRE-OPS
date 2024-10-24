import { useSelector } from "react-redux";
import CurrencySummaryCard from "../../UI/SummaryCard/CurrencySummaryCard";

const PortfolioCarryForwardFunding = () => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);

    const carryForwardFunding = portfolioBudget.carry_forward_funding?.amount || 0;

    return (
        <CurrencySummaryCard
            headerText="Previous FYs Carry-Forward"
            amount={carryForwardFunding}
        />
    );
};

export default PortfolioCarryForwardFunding;
