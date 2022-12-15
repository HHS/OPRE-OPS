import { useSelector } from "react-redux";
import CurrencySummaryCard from "../UI/CurrencySummaryCard/CurrencySummaryCard";

const PortfolioNewFunding = ({ fiscalYear }) => {
    const portfolioFunding = useSelector((state) => state.portfolioFundingSummary.portfolioFunding);

    const newFunding = portfolioFunding.total_funding?.amount - portfolioFunding.carry_over_funding?.amount;

    const headerText = `FY ${fiscalYear} New Budget`;

    return <CurrencySummaryCard headerText={headerText} amount={newFunding} />;
};

export default PortfolioNewFunding;
