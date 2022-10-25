import PortfolioFundingTotal from "../PortfolioFundingTotal/PortfolioFundingTotal";
import { useDispatch, useSelector } from "react-redux";
import { defaultPortfolioFunding, setPortfolio, setPortfolioFunding } from "./portfolioFundingSummarySlice";
import { useEffect } from "react";
import { getPortfolioAndSetState, getPortfolioFundingAndSetState } from "./util";
import { getCurrentFiscalYear } from "../PortfolioFundingTotal/util";
import PortfolioFundingByBudgetStatus from "../PortfolioFundingByBudgetStatus/PortfolioFundingByBudgetStatus";
import PortfolioFundingByBudgetStatusNivio from "../PortfolioFundingByBudgetStatusNivio/PortfolioFundingByBudgetStatusNivio";

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

    return (
        <section>
            <h3 className="site-preview-heading desktop:grid-col-12">Funding Summary</h3>
            <ul className="usa-card-group">
                <li className="usa-card desktop:grid-col-5">
                    <PortfolioFundingTotal portfolioId={portfolio.id} />
                </li>
                <li className="usa-card usa-card--flag usa-card--media-right desktop:grid-col-7">
                    <PortfolioFundingByBudgetStatusNivio portfolioId={portfolio.id} />
                </li>
            </ul>
        </section>
    );
};

export default PortfolioFundingSummary;
