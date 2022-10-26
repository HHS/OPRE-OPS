import { getCents, getCurrentFiscalYear } from "./util";
import { useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";

const PortfolioFundingTotal = () => {
    const today = new Date();
    const portfolioFunding = useSelector((state) => state.portfolioFundingSummary.portfolioFunding);

    return (
        <div className="usa-card__container bg-base-lightest font-family-sans">
            <div className="usa-card__header padding-left-1 padding-top-1">
                <div className="use-card__heading">
                    <h3 className="margin-0 font-sans-3xs text-normal">
                        FY {getCurrentFiscalYear(today)} Total Budget
                    </h3>
                </div>
            </div>
            <div className="usa-card__body padding-left-2 padding-top-3">
                <CurrencyWithSmallCents
                    dollarsClasses="font-sans-2xl"
                    centsClasses="font-sans-3xs"
                    amount={portfolioFunding.total_funding.amount}
                />
            </div>
        </div>
    );
};

export default PortfolioFundingTotal;
