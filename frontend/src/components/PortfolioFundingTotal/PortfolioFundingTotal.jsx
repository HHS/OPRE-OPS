import { getCents, getCurrentFiscalYear } from "./util";
import { useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";

library.add(faSquare);

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
            <div className="usa-card__body padding-left-1 padding-top-3">
                <CurrencyFormat
                    value={parseInt(portfolioFunding.total_funding.amount)}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$ "}
                    renderText={(value) => <span className="font-sans-2xl text-bold margin-bottom-0">{value}</span>}
                />
                <CurrencyFormat
                    value={getCents(portfolioFunding.total_funding.amount)}
                    displayType={"text"}
                    renderText={(value) => <span className="font-sans-3xs text-bold margin-bottom-0">.{value}</span>}
                />
            </div>
        </div>
    );
};

export default PortfolioFundingTotal;
