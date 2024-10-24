import { useSelector } from "react-redux";
import CurrencySummaryCard from "../../UI/SummaryCard/CurrencySummaryCard";

const PortfolioNewFunding = () => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);

    const newFunding = portfolioBudget.total_funding?.amount - portfolioBudget.carry_forward_funding?.amount;

    const headerText = `FY ${fiscalYear.value} New Funding`;

    return (
        <CurrencySummaryCard
            headerText={headerText}
            amount={newFunding}
        />
    );
};

export default PortfolioNewFunding;
