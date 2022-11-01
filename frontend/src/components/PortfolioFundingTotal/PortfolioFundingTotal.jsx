import { useSelector } from "react-redux";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";

const PortfolioFundingTotal = (props) => {
    const portfolioFunding = useSelector((state) => state.portfolioFundingSummary.portfolioFunding);

    const styles = {
        cardContainer: {
            display: "flex",
            borderColor: "#FFF",
        },
    };

    return (
        <div
            className="usa-card__container bg-base-lightest font-family-sans padding-left-2"
            style={styles.cardContainer}
        >
            <div className="usa-card__header padding-top-2">
                <div className="use-card__heading">
                    <h3 className="margin-0 font-sans-3xs text-normal">FY {props.fiscalYear} Total Budget</h3>
                </div>
            </div>
            <div className="usa-card__body padding-top-3 padding-bottom-4">
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
