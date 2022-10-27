import PortfolioFundingTotal from "../PortfolioFundingTotal/PortfolioFundingTotal";
import { useDispatch, useSelector } from "react-redux";
import { defaultPortfolioFunding, setPortfolio, setPortfolioFunding } from "./portfolioFundingSummarySlice";
import { useEffect } from "react";
import { getPortfolioAndSetState, getPortfolioFundingAndSetState } from "./util";
import { getCurrentFiscalYear } from "../PortfolioFundingTotal/util";
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
        const currentFiscalYear = getCurrentFiscalYear(new Date());
        dispatch(getPortfolioFundingAndSetState(props.portfolioId, currentFiscalYear));

        return () => {
            dispatch(setPortfolioFunding(defaultPortfolioFunding));
        };
    }, [dispatch, props.portfolioId]);

    const styles = {
        cardGroup: {
            margin: "auto",
            width: "1024px",
        },
        card: {
            height: "220px",
        },
    };

    return (
        <section>
            <h3 className="font-sans-lg">Portfolio Budget Summary</h3>
            <p className="font-sans-sm">
                The graphs below show a summary of the total budget for this portfolio, not including additional funding
                from other portfolios.
            </p>
            <ul className="usa-card-group grid-gap" style={styles.cardGroup}>
                <li className="usa-card desktop:grid-col-auto" style={styles.card}>
                    <PortfolioFundingTotal portfolioId={portfolio.id} />
                </li>
                <li className="usa-card usa-card--flag desktop:grid-col-auto usa-card--media-right" style={styles.card}>
                    <PortfolioFundingByBudgetStatus portfolioId={portfolio.id} />
                </li>
            </ul>
        </section>
    );
};

export default PortfolioFundingSummary;
