import PortfolioFunding from "../PortfolioFunding/PortfolioFunding";
import { useDispatch, useSelector } from "react-redux";
import { setPortfolio, setPortfolioFunding } from "./portfolioFundingSummarySlice";
import { useEffect } from "react";
import { getPortfolioAndSetState, getPortfolioFundingAndSetState } from "./util";
import { getCurrentFiscalYear } from "../PortfolioFunding/util";

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
            dispatch(setPortfolioFunding({}));
        };
    }, [dispatch, props.portfolioId]);

    return (
        <>
            <h3 className="site-preview-heading desktop:grid-col-12">Funding Summary</h3>
            <ul className="usa-card-group">
                <li className="usa-card usa-card--flag desktop:grid-col-6">
                    <PortfolioFunding portfolioId={portfolio.id} />
                </li>
                <li className="usa-card usa-card--flag desktop:grid-col-6">
                    <PortfolioFunding portfolioId={portfolio.id} />
                </li>
            </ul>
        </>
    );
};

export default PortfolioFundingSummary;
