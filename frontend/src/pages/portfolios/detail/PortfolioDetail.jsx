import { useDispatch, useSelector } from "react-redux";
import { getPortfolioAndSetState } from "./getPortfolio";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import PortfolioFundingSummary from "../../../components/PortfolioFundingSummary/PortfolioFundingSummary";
import { setPortfolio, setPortfolioCans, setPortfolioCansFundingDetails } from "./portfolioDetailSlice";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import App from "../../../App";
import { BreadcrumbItem, BreadcrumbList } from "../../../components/Header/Breadcrumb";
import PortfolioHeader from "../../../components/PortfolioHeader/PortfolioHeader";
import CanCard from "../../../components/CanCard/CanCard";

import styles from "./styles.module.css";
import { getPortfolioCansAndSetState, getPortfolioCansFundingDetailsAndSetState } from "./getPortfolioCans";

const PortfolioDetail = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id);
    const currentFiscalYear = getCurrentFiscalYear(new Date());
    const portfolioCans = useSelector((state) => state.portfolioDetail.portfolioCans);

    useEffect(() => {
        dispatch(getPortfolioAndSetState(portfolioId));
        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, portfolioId]);

    useEffect(() => {
        try {
            dispatch(getPortfolioCansAndSetState(portfolioId, currentFiscalYear));
        } catch (error) {
            return () => {
                dispatch(setPortfolioCans({}));
            };
        }
    }, [dispatch, portfolioId, currentFiscalYear]);

    useEffect(() => {
        portfolioCans.map((can) => {
            dispatch(getPortfolioCansFundingDetailsAndSetState(can.id, currentFiscalYear));
        });
        return () => {
            dispatch(setPortfolioCansFundingDetails([]));
        };
    }, [dispatch, currentFiscalYear, portfolioCans]);

    const canCards = portfolioCans.length
        ? portfolioCans.map((can, i) => <CanCard can={can} fiscalYear={currentFiscalYear} key={i} />)
        : "";

    return (
        <>
            <App>
                <BreadcrumbList>
                    <BreadcrumbItem isCurrent pageName="Portfolios" />
                </BreadcrumbList>
                <div style={styles.body}>
                    <div className="margin-left-2 margin-right-2">
                        <PortfolioHeader />
                        <section>
                            <PortfolioFundingSummary portfolioId={portfolioId} fiscalYear={currentFiscalYear} />
                        </section>
                        <section>
                            <h2>Portfolio Budget Details by CAN </h2>
                            <p>
                                The list of CANs below are specific to this portfolio’s budget. It does not include
                                funding from other CANs outside of this portfolio that might occur during
                                cross-portfolio collaborations on research projects.
                            </p>
                            {canCards.length ? canCards : <span>No CANs to display.</span>}
                        </section>
                    </div>
                </div>
            </App>
        </>
    );
};

export default PortfolioDetail;
