import { useSelector } from "react-redux";
import CurrencySummaryCard from "../UI/CurrencySummaryCard/CurrencySummaryCard";

const PortfolioFundingTotal = ({ fiscalYear }) => {
    const portfolioFunding = useSelector((state) => state.portfolioFundingSummary.portfolioFunding);

    const headerText = `FY ${fiscalYear} Total Budget`;

    return <CurrencySummaryCard headerText={headerText} amount={portfolioFunding.total_funding.amount} />;
};

export default PortfolioFundingTotal;
