import PortfolioFundingTotal from "../PortfolioSummaryCards/PortfolioFundingTotal";
import PortfolioFundingByBudgetStatus from "../PortfolioFundingByBudgetStatus/PortfolioFundingByBudgetStatus";
import { useDispatch, useSelector } from "react-redux";
import { defaultPortfolioBudget, setPortfolio, setPortfolioBudget } from "./portfolioBudgetSummarySlice";
import { useEffect } from "react";
import { getPortfolioAndSetState, getPortfolioFundingAndSetState } from "./util";
import PortfolioNewFunding from "../PortfolioSummaryCards/PortfolioNewFunding";
import PortfolioCarryForwardFunding from "../PortfolioSummaryCards/PortfolioCarryForwardFunding";

import styles from "./styles.module.css";
import PortfolioFundingByCAN from "../PortfolioFundingByCAN/PortfolioFundingByCAN";
import FiscalYear from "../UI/FiscalYear/FiscalYear";

const PortfolioBudgetSummary = ({ portfolioId }) => {
    const portfolio = useSelector((state) => state.portfolioBudgetSummary.portfolio);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const dispatch = useDispatch();

    // fetch initial Portfolio details
    useEffect(() => {
        dispatch(getPortfolioAndSetState(portfolioId));

        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, portfolioId]);

    // calculate current total funding for Portfolio
    useEffect(() => {
        dispatch(getPortfolioFundingAndSetState(portfolioId, fiscalYear.value));

        return () => {
            dispatch(setPortfolioBudget(defaultPortfolioBudget));
        };
    }, [dispatch, portfolioId, fiscalYear]);

    const fundingCard = `usa-card grid-col-4 ${styles.fundingCard}`;
    const budgetStatusCard = `grid-col-2 ${styles.budgetStatusCard}`;
    const leftBudgetCard = `${styles.leftBudgetCard}`;
    const rightBudgetCard = `${styles.rightBudgetCard}`;

    return (
        <div>
            <section>
                <div className={styles.summaryHeader}>
                    <h2 className="font-sans-lg">Portfolio Budget Summary</h2>
                    <FiscalYear className={styles.fiscalYearSelect} fiscalYear={fiscalYear} />
                </div>
                <p className="font-sans-sm">
                    The graph below shows a summary of the total budget for this portfolio, not including additional
                    funding from other portfolios.
                </p>
                <ul className="usa-card-group">
                    <li className={fundingCard}>
                        <PortfolioFundingTotal portfolioId={portfolio.id} />
                    </li>
                    <li className={fundingCard}>
                        <PortfolioNewFunding portfolioId={portfolio.id} />
                    </li>
                    <li className={fundingCard}>
                        <PortfolioCarryForwardFunding portfolioId={portfolio.id} />
                    </li>
                </ul>
            </section>
            <section>
                <div className={budgetStatusCard}>
                    <div className={leftBudgetCard}>
                        <PortfolioFundingByBudgetStatus portfolioId={portfolio.id} />
                    </div>
                    <div className={rightBudgetCard}>
                        <PortfolioFundingByCAN portfolioId={portfolio.id} />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PortfolioBudgetSummary;
