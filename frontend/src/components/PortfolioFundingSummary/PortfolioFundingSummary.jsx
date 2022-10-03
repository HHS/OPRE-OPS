import PortfolioFunding from "../PortfolioFunding/PortfolioFunding";
import { useDispatch, useSelector } from "react-redux";
import { setPortfolio, setBudgetLineItems, setTotalFunding } from "./portfolioFundingSummarySlice";
import { useEffect } from "react";
import { getBudgetLineItemsAndSetState, getPortfolioAndSetState } from "./util";
import { getCurrentFiscalYear } from "../PortfolioFunding/util";

const PortfolioFundingSummary = (props) => {
    const portfolio = useSelector((state) => state.portfolioFundingSummary.portfolio);
    const budgetLineItems = useSelector((state) => state.portfolioFundingSummary.budgetLineItems);
    const dispatch = useDispatch();

    // fetch initial Portfolio details
    useEffect(() => {
        dispatch(getPortfolioAndSetState(props.portfolioId));

        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, props.portfolioId]);

    // fetch current BudgetLineItem for Portfolio
    useEffect(() => {
        const currentFiscalYear = getCurrentFiscalYear(new Date());
        dispatch(getBudgetLineItemsAndSetState({ portfolioId: props.portfolioId, fiscalYear: currentFiscalYear }));

        return () => {
            dispatch(setBudgetLineItems({}));
        };
    }, [dispatch, props.portfolioId]);

    // calculate current total funding for Portfolio
    useEffect(() => {
        if (Array.isArray(budgetLineItems)) {
            const calculatedTotalFunding = budgetLineItems.reduce((accumulator, object) => {
                return accumulator + parseFloat(object.funding);
            }, 0);
            dispatch(setTotalFunding(calculatedTotalFunding));
        }
    }, [dispatch, budgetLineItems]);

    return (
        <>
            <h3 className="site-preview-heading desktop:grid-col-12">Funding Summary</h3>
            <div className="usa-card-group">
                <li className="usa-card usa-card--flag usa-card--media-right desktop:grid-col-6">
                    <PortfolioFunding portfolioId={portfolio.id} />
                </li>
                <li className="usa-card usa-card--flag usa-card--media-right desktop:grid-col-6">
                    <PortfolioFunding portfolioId={portfolio.id} />
                </li>
            </div>
        </>
    );
};

export default PortfolioFundingSummary;
