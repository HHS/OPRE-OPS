import PortfolioFundingTotal from "../PortfolioSummaryCards/PortfolioFundingTotal";
import PortfolioFundingByBudgetStatus from "../PortfolioFundingByBudgetStatus/PortfolioFundingByBudgetStatus";
import { useDispatch, useSelector } from "react-redux";
import { defaultPortfolioFunding, setPortfolio, setPortfolioFunding } from "./portfolioFundingSummarySlice";
import { useEffect } from "react";
import { getPortfolioAndSetState, getPortfolioFundingAndSetState } from "./util";
import PortfolioNewFunding from "../PortfolioSummaryCards/PortfolioNewFunding";
import PortfolioCarryForwardFunding from "../PortfolioSummaryCards/PortfolioCarryForwardFunding";

import styles from "./styles.module.css";
import PortfolioFundingByCAN from "../PortfolioFundingByCAN/PortfolioFundingByCAN";

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

    const fundingCard = `usa-card grid-col-4 ${styles.fundingCard}`;
    const budgetStatusCard = `grid-col-2 ${styles.budgetStatusCard}`;
    const leftBudgetCard = `${styles.leftBudgetCard}`;
    const rightBudgetCard = `${styles.rightBudgetCard}`;

    return (
        <div>
            <section>
                <h2 className="font-sans-lg">Portfolio Budget Summary</h2>
                <p className="font-sans-sm">
                    The graph below shows a summary of the total budget for this portfolio, not including additional
                    funding from other portfolios.
                </p>
                <ul className="usa-card-group">
                    <li className={fundingCard}>
                        <PortfolioFundingTotal portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                    </li>
                    <li className={fundingCard}>
                        <PortfolioNewFunding portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                    </li>
                    <li className={fundingCard}>
                        <PortfolioCarryForwardFunding portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                    </li>
                </ul>
            </section>
            <section>
                <div className={budgetStatusCard}>
                    <div className={leftBudgetCard}>
                        <PortfolioFundingByBudgetStatus portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                    </div>
                    <div className={rightBudgetCard}>
                        <PortfolioFundingByCAN portfolioId={portfolio.id} fiscalYear={props.fiscalYear} />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PortfolioFundingSummary;
