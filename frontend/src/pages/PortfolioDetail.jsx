import { useDispatch, useSelector } from "react-redux";
import { getPortfolio, getPortfolioCans } from "../api/getPortfolio";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import PortfolioBudgetSummary from "../components/Portfolios/PortfolioBudgetSummary/PortfolioBudgetSummary";
import { setPortfolio, setPortfolioCans, setPortfolioCansFundingDetails } from "../store/portfolioSlice";
import App from "../App";
import { BreadcrumbItem, BreadcrumbList } from "../components/UI/Header/Breadcrumb";
import PortfolioHeader from "../components/Portfolios/PortfolioHeader/PortfolioHeader";
import CanCard from "../components/CANs/CanCard/CanCard";

import { getPortfolioCansFundingDetails } from "../api/getCanFundingSummary";

const PortfolioDetail = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id);
    const portfolioCans = useSelector((state) => state.portfolio.portfolioCans);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);

    // Get initial Portfolio data (not dependent on fiscal year)
    useEffect(() => {
        const getPortfolioAndSetState = async () => {
            const result = await getPortfolio(portfolioId);
            dispatch(setPortfolio(result));
        };

        getPortfolioAndSetState().catch(console.error);

        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, portfolioId]);

    // Get CAN data for the Portfolio (dependent on fiscal year)
    useEffect(() => {
        const getPortfolioCansAndSetState = async () => {
            const result = await getPortfolioCans(portfolioId, fiscalYear.value);
            dispatch(setPortfolioCans(result));
        };

        getPortfolioCansAndSetState().catch(console.error);

        return () => {
            dispatch(setPortfolioCans([]));
        };
    }, [dispatch, portfolioId, fiscalYear]);

    // Get CAN Funding Data (dependent on fiscal year)
    useEffect(() => {
        const getPortfolioCansFundingDetailsAndSetState = async (data) => {
            const result = await Promise.all(data.map(getPortfolioCansFundingDetails));
            dispatch(setPortfolioCansFundingDetails(result));
        };

        console.log(`fiscalYear.value=${fiscalYear.value}`);
        const canData = portfolioCans.map((can) => ({ id: can.id, fiscalYear: fiscalYear.value }));

        if (canData.length > 0) {
            getPortfolioCansFundingDetailsAndSetState(canData).catch(console.error);
        }
        return () => {
            dispatch(setPortfolioCansFundingDetails([]));
        };
    }, [dispatch, fiscalYear, portfolioCans]);

    const canCards = portfolioCans.length
        ? portfolioCans.map((can, i) => <CanCard can={can} fiscalYear={fiscalYear.value} key={i} />)
        : "";

    return (
        <>
            <App>
                <BreadcrumbList>
                    <BreadcrumbItem isCurrent pageName="Portfolios" />
                </BreadcrumbList>
                <div>
                    <div className="margin-left-2 margin-right-2">
                        <PortfolioHeader />
                        <section>
                            <PortfolioBudgetSummary portfolioId={portfolioId} />
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
