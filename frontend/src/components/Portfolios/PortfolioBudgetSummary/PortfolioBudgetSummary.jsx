import PortfolioFundingTotal from "../PortfolioSummaryCards/PortfolioFundingTotal";
import PortfolioFundingByBudgetStatus from "../PortfolioFundingByBudgetStatus/PortfolioFundingByBudgetStatus";
import { useDispatch, useSelector } from "react-redux";
import { defaultPortfolioBudget, setPortfolio, setPortfolioBudget } from "./portfolioBudgetSummarySlice";
import { useEffect } from "react";
import { getPortfolioAndSetState, getPortfolioFundingAndSetState } from "./util";

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

    return (
        <section>

            <div className="display-flex flex-justify">
                <PortfolioFundingTotal portfolioId={portfolio.id} />
                <PortfolioFundingByBudgetStatus portfolioId={portfolio.id} />
            </div>
        </section>
    );
};

export default PortfolioBudgetSummary;
