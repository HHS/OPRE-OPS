import { useDispatch, useSelector } from "react-redux";
import { getPortfolio } from "./getPortfolio";
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";

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

    useEffect(() => {
        dispatch(getPortfolio(urlPathParams.id));
    }, [dispatch, urlPathParams.id]);

    return (
        <>
            <h1>{portfolio.name}</h1>
            <h2>Portfolio description</h2>
            {portfolio.description}
            <h2>Status</h2>
            {portfolio.status}
            <h2>Fiscal Year Funding</h2>
            {portfolio.current_fiscal_year_funding}
            <h2>CANs</h2>
            <ul className="usa-list">
                {portfolio.cans?.map((can) => (
                    <CanList key={can.id} id={can.id} name={can.number} />
                ))}
            </ul>
        </>
    );
};

export default PortfolioDetail;
