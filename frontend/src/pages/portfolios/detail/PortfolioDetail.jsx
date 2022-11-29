import { useDispatch, useSelector } from "react-redux";
import { getPortfolioAndSetState } from "./getPortfolio";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import PortfolioFundingSummary from "../../../components/PortfolioFundingSummary/PortfolioFundingSummary";
import { setPortfolio, setPortfolioCans } from "./portfolioDetailSlice";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import App from "../../../App";
import { BreadcrumbItem, BreadcrumbList } from "../../../components/Header/Breadcrumb";
import PortfolioHeader from "../../../components/PortfolioHeader/PortfolioHeader";
import CanCard from "../../../components/CanCard/CanCard";

const CanList = ({ id, name }) => {
    return (
        <li>
            <Link to={`/cans/${id}`}>{name}</Link>
        </li>
    );
};
import styles from "./styles.module.css";

const PortfolioDetail = () => {
    const dispatch = useDispatch();
    //const portfolio = useSelector((state) => state.portfolioDetail.portfolio);
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id);
    const canId = 1;
    const currentFiscalYear = getCurrentFiscalYear(new Date());
    const portfolioCans = useSelector((state) => state.portfolioDetail.portfolioCans);

    useEffect(() => {
        dispatch(getPortfolioAndSetState(portfolioId));
        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, portfolioId]);

    return (
        <App>
            <BreadcrumbList>
                <BreadcrumbItem isCurrent pageName="Portfolios" />
            </BreadcrumbList>
            <div>
                <div className="margin-left-2 margin-right-2">
                    <PortfolioHeader />
                    <section>
                        <PortfolioFundingSummary portfolioId={portfolioId} fiscalYear={currentFiscalYear} />
                    </section>
                    <section>
                        <h2>CANs</h2>
                        <ul className="usa-list">
                            {portfolio.internal_can?.map((can) => (
                                <CanList key={can.id} id={can.id} name={can.number} />
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </App>
    );
};

export default PortfolioDetail;
