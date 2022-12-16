import { useSelector } from "react-redux";
import CurrencySummaryCard from "../UI/CurrencySummaryCard/CurrencySummaryCard";

const PortfolioFundingTotal = () => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);

    const headerText = `FY ${fiscalYear.value} Total Budget`;

    return <CurrencySummaryCard headerText={headerText} amount={portfolioBudget.total_funding.amount} />;
};

export default PortfolioFundingTotal;
