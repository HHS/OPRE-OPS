import { useSelector } from "react-redux";
import CurrencyCard from "../../UI/Cards/CurrencyCard";

const PortfolioNewFunding = () => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);

    const newFunding = portfolioBudget.total_funding?.amount - portfolioBudget.carry_forward_funding?.amount;

    const headerText = `FY ${fiscalYear.value} New Funding`;

    return (
        <CurrencyCard
            headerText={headerText}
            amount={newFunding}
        />
    );
};

export default PortfolioNewFunding;
