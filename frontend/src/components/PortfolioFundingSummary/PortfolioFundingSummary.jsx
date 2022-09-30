import PortfolioFunding from "../PortfolioFunding/PortfolioFunding";
import { useDispatch, useSelector } from "react-redux";
import { getPortfolio } from "../../pages/portfolios/detail/getPortfolio";
import { setPortfolio } from "./portfolioFundingSummarySlice";
import { useEffect } from "react";

const PortfolioFundingSummary = (props) => {
    const portfolio = useSelector((state) => state.portfolioFundingSummary.portfolio);
    const dispatch = useDispatch();

    useEffect(() => {
        const callBackend = async () => {
            const returnedPortfolio = await getPortfolio(props.portfolioId);
            dispatch(setPortfolio(returnedPortfolio));
        };

        callBackend();

        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, props.portfolioId]);

    return (
        <>
            <h3 className="site-preview-heading">Funding Summary</h3>
            <div className="usa-card-group">
                <li className="usa-card usa-card--flag usa-card--media-right">
                    <PortfolioFunding portfolioId={portfolio.id} />
                </li>
                <li className="usa-card usa-card--flag usa-card--media-right">
                    <PortfolioFunding portfolioId={portfolio.id} />
                </li>
            </div>
        </>
    );
};

export default PortfolioFundingSummary;
