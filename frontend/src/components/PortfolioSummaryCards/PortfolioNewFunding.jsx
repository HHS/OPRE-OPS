import { useSelector } from "react-redux";
import CurrencySummaryCard from "../UI/CurrencySummaryCard/CurrencySummaryCard";

const PortfolioNewFunding = (props) => {
    const portfolioFunding = useSelector((state) => state.portfolioFundingSummary.portfolioFunding);

    const newFunding = portfolioFunding.total_funding?.amount - portfolioFunding.carry_over_funding?.amount;

    return <CurrencySummaryCard headerText="New Funding" amount={newFunding} />;
};

export default PortfolioNewFunding;
