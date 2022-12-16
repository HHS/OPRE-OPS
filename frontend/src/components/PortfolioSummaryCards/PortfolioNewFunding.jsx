import { useSelector } from "react-redux";
import CurrencySummaryCard from "../UI/CurrencySummaryCard/CurrencySummaryCard";

const PortfolioNewFunding = ({ fiscalYear }) => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);

    const newFunding = portfolioBudget.total_funding?.amount - portfolioBudget.carry_over_funding?.amount;

    const headerText = `FY ${fiscalYear} New Budget`;

    return <CurrencySummaryCard headerText={headerText} amount={newFunding} />;
};

export default PortfolioNewFunding;
