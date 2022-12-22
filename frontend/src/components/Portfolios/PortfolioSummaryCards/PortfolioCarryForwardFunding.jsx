import { useSelector } from "react-redux";
import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";

const PortfolioCarryForwardFunding = () => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);

    const carryForwardFunding = portfolioBudget.carry_over_funding?.amount || 0;

    return <CurrencySummaryCard headerText="Previous FYs Carry-Forward" amount={carryForwardFunding} />;
};

export default PortfolioCarryForwardFunding;
