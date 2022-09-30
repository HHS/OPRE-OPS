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

    useEffect(() => {
        dispatch(getPortfolioAndSetState(props.portfolioId));

        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, props.portfolioId]);

    useEffect(() => {
        const currentFiscalYear = getCurrentFiscalYear(new Date());
        dispatch(getBudgetLineItemsAndSetState({ portfolioId: portfolio.id, fiscalYear: currentFiscalYear }));

        return () => {
            dispatch(setBudgetLineItems({}));
        };
    }, [dispatch, portfolio]);

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
            <h3 className="site-preview-heading">Funding Summary</h3>
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
