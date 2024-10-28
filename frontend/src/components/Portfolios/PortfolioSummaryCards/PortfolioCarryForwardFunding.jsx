import { useSelector } from "react-redux";
import CurrencyCard from "../../UI/Cards/CurrencyCard";

const PortfolioCarryForwardFunding = () => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);

    const carryForwardFunding = portfolioBudget.carry_forward_funding?.amount || 0;

    return (
        <CurrencyCard
            headerText="Previous FYs Carry-Forward"
            amount={carryForwardFunding}
        />
    );
};

export default PortfolioCarryForwardFunding;
