import PortfolioFundingTotal from "../PortfolioSummaryCards/PortfolioFundingTotal";
import PortfolioFundingByBudgetStatus from "../PortfolioFundingByBudgetStatus/PortfolioFundingByBudgetStatus";
import { useDispatch, useSelector } from "react-redux";
import { defaultPortfolioFunding, setPortfolio, setPortfolioFunding } from "./portfolioFundingSummarySlice";
import { useEffect } from "react";
import { getPortfolioAndSetState, getPortfolioFundingAndSetState } from "./util";
import PortfolioNewFunding from "../PortfolioSummaryCards/PortfolioNewFunding";
import PortfolioCarryForwardFunding from "../PortfolioSummaryCards/PortfolioCarryForwardFunding";

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
        fundingCard: {
            height: "220px",
        },
        donutCard: {
            height: "220px",
        },
    };

    return (
        <section>
            <h2 className="font-sans-lg">Portfolio Budget Summary</h2>
            <p className="font-sans-sm">
                The graph below shows a summary of the total budget for this portfolio, not including additional funding
                from other portfolios.
            </p>
            <ul className="usa-card-group">
                <li className="usa-card grid-col-4" style={styles.fundingCard}>
                    <PortfolioFundingTotal portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                </li>
                <li className="usa-card grid-col-4" style={styles.fundingCard}>
                    <PortfolioNewFunding portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                </li>
                <li className="usa-card grid-col-4" style={styles.fundingCard}>
                    <PortfolioCarryForwardFunding portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                </li>
            </ul>
            <ul className="usa-card-group grid-gap">
                <li className="usa-card usa-card--flag usa-card--media-right" style={styles.donutCard}>
                    <PortfolioFundingByBudgetStatus portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                </li>
            </ul>
        </section>
    );
};

export default PortfolioFundingSummary;
