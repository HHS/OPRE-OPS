import PortfolioFundingTotal from "../PortfolioFundingTotal/PortfolioFundingTotal";
import { useDispatch, useSelector } from "react-redux";
import { defaultPortfolioFunding, setPortfolio, setPortfolioFunding } from "./portfolioFundingSummarySlice";
import { useEffect } from "react";
import { getPortfolioAndSetState, getPortfolioFundingAndSetState } from "./util";
import PortfolioFundingByBudgetStatus from "../PortfolioFundingByBudgetStatus/PortfolioFundingByBudgetStatus";

const PortfolioFundingSummary = (props) => {
    const portfolio = useSelector((state) => state.portfolioFundingSummary.portfolio);
    const dispatch = useDispatch();

    // fetch initial Portfolio details
    useEffect(() => {
        dispatch(getPortfolioAndSetState(props.portfolioId));

        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, props.portfolioId]);

    // calculate current total funding for Portfolio
    useEffect(() => {
        dispatch(getPortfolioFundingAndSetState(props.portfolioId, props.fiscalYear));

        return () => {
            dispatch(setPortfolioFunding(defaultPortfolioFunding));
        };
    }, [dispatch, props.portfolioId, props.fiscalYear]);

    const styles = {
        cardGroup: {
            margin: "auto",
            width: "1000px",
        },
        card: {
            height: "220px",
        },
    };

    return (
        <section>
            <h2 className="font-sans-lg">Portfolio Budget Summary</h2>
            <p className="font-sans-sm">
                The graphs below show a summary of the total budget for this portfolio, not including additional funding
                from other portfolios.
            </p>
            <ul className="usa-card-group grid-gap">
                <li className="usa-card desktop:grid-col-5" style={styles.card}>
                    <PortfolioFundingTotal portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                </li>
                <li className="usa-card usa-card--flag desktop:grid-col-7 usa-card--media-right" style={styles.card}>
                    <PortfolioFundingByBudgetStatus portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                </li>
            </ul>
        </section>
    );
};

export default PortfolioFundingSummary;
