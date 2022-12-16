import { useSelector } from "react-redux";
import CurrencySummaryCard from "../UI/CurrencySummaryCard/CurrencySummaryCard";

const PortfolioFundingTotal = ({ fiscalYear }) => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);

    const headerText = `FY ${fiscalYear} Total Budget`;

    return <CurrencySummaryCard headerText={headerText} amount={portfolioBudget.total_funding.amount} />;
};

export default PortfolioFundingTotal;
