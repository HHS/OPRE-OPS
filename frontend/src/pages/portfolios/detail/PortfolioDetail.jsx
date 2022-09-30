import { useDispatch, useSelector } from "react-redux";
import { getPortfolio } from "./getPortfolio";
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PortfolioFundingSummary from "../../../components/PortfolioFundingSummary/PortfolioFundingSummary";
import { setPortfolio } from "./portfolioDetailSlice";

const CanList = ({ id, name }) => {
    return (
        <li>
            <Link to={`/cans/${id}`}>{name}</Link>
        </li>
    );
};

const PortfolioDetail = () => {
    const dispatch = useDispatch();
    const portfolio = useSelector((state) => state.portfolioDetail.portfolio);
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id);

    useEffect(() => {
        dispatch(getPortfolio(portfolioId));

        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, portfolioId]);

    return (
        <div className="grid-container">
            <div className="grid-row">
                <h1>{portfolio.name}</h1>
            </div>
            <div className="grid-row">
                <h2>Portfolio description</h2>
                {portfolio.description}
            </div>
            <div className="grid-row">
                <PortfolioFundingSummary portfolioId={portfolioId} />
            </div>
            <div className="grid-row">
                <h2>CANs</h2>
                <ul className="usa-list">
                    {portfolio.cans?.map((can) => (
                        <CanList key={can.id} id={can.id} name={can.number} />
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PortfolioDetail;
