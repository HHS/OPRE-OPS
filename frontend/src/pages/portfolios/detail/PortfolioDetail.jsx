import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { getPortfolio, getPortfolioCans } from "./getPortfolio";
import {
    setPortfolio,
    setPortfolioCans,
    setPortfolioCansFundingDetails,
    setSelectedFiscalYear
} from "./portfolioSlice";
import App from "../../../App";
import { getPortfolioCansFundingDetails } from "../../../api/getCanFundingSummary";
import PortfolioTabsSection from "../../../components/Portfolios/PortfolioTabsSection";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import Hero from "../../../components/UI/Hero/Hero";
import { useGetPortfolioCansByIdQuery } from "../../../api/opsAPI";

const PortfolioDetail = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id);
    const portfolioCans = useSelector((state) => state.portfolio.portfolioCans);
    const selectedFiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const fiscalYear = Number(selectedFiscalYear.value);
    const portfolio = useSelector((state) => state.portfolio.portfolio);

    const { data, isLoading } = useGetPortfolioCansByIdQuery({ portfolioId, year: fiscalYear });
    const budgetLineIds = [...new Set(data?.flatMap((can) => can.budget_line_items))];

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
            const result = await getPortfolioCans(portfolioId, fiscalYear);
            dispatch(setPortfolioCans(result));
        };

        getPortfolioCansAndSetState().catch(console.error);

        return () => {
            dispatch(setPortfolioCans([]));
        };
    }, [dispatch, portfolioId, selectedFiscalYear]);

    // Get CAN Funding Data (dependent on fiscal year)
    useEffect(() => {
        const getPortfolioCansFundingDetailsAndSetState = async (data) => {
            const result = await Promise.all(data.map(getPortfolioCansFundingDetails));
            dispatch(setPortfolioCansFundingDetails(result));
        };

        const canData = portfolioCans.map((can) => ({ id: can.id, fiscalYear: fiscalYear }));

        if (canData.length > 0) {
            getPortfolioCansFundingDetailsAndSetState(canData).catch(console.error);
        }
        return () => {
            dispatch(setPortfolioCansFundingDetails([]));
        };
    }, [dispatch, selectedFiscalYear, portfolioCans]);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <App breadCrumbName={portfolio?.name}>
            <div>
                <Hero
                    entityName={portfolio?.name}
                    divisionName={portfolio.division?.name}
                    label="Portfolio Description"
                    description={portfolio?.description}
                    teamLeaders={portfolio?.team_leaders}
                    urls={portfolio?.urls}
                />
                <section className="display-flex flex-justify margin-top-3">
                    <PortfolioTabsSection portfolioId={portfolioId} />
                    <FiscalYear
                        className="margin-left-auto"
                        fiscalYear={fiscalYear}
                        handleChangeFiscalYear={setSelectedFiscalYear}
                    />
                </section>
                <Outlet context={{ portfolioId, budgetLineIds }} />
            </div>
        </App>
    );
};

export default PortfolioDetail;
