import { useDispatch, useSelector } from "react-redux";
import { getPortfolioAndSetState } from "./getPortfolio";
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PortfolioFundingSummary from "../../../components/PortfolioFundingSummary/PortfolioFundingSummary";
import { setPortfolio } from "./portfolioDetailSlice";

const styles = {
    body: {
        width: "1024px",
        margin: "auto",
    },
};

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
        dispatch(getPortfolioAndSetState(portfolioId));

        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, portfolioId]);

    return (
        <main style={styles.body}>
            <section>
                <h1 className="font-sans-2xl">{portfolio.name}</h1>
                {portfolio.description}
            </section>
            <section>
                <PortfolioFundingSummary portfolioId={portfolioId} />
            </section>
            <section>
                <h2>CANs</h2>
                <ul className="usa-list">
                    {portfolio.internal_can?.map((can) => (
                        <CanList key={can.id} id={can.id} name={can.number} />
                    ))}
                </ul>
            </section>
        </main>
    );
};

export default PortfolioDetail;
