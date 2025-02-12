import { useSelector } from "react-redux";
import { Outlet, useParams } from "react-router-dom";
import App from "../../../App";
import { useGetPortfolioByIdQuery, useGetPortfolioCansByIdQuery } from "../../../api/opsAPI";
import PortfolioTabsSection from "../../../components/Portfolios/PortfolioTabsSection";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import Hero from "../../../components/UI/Hero/Hero";
import { setSelectedFiscalYear } from "./portfolioSlice";

const PortfolioDetail = () => {
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id || "0");
    const selectedFiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const fiscalYear = Number(selectedFiscalYear.value);
    const { data: portfolio, isLoading: portfolioIsLoading } = useGetPortfolioByIdQuery(portfolioId);
    const { data: portfolioCans, isLoading } = useGetPortfolioCansByIdQuery({ portfolioId, year: fiscalYear });
    const budgetLineIds = [...new Set(portfolioCans?.flatMap((can) => can.budget_line_items))];

    if (isLoading || portfolioIsLoading) {
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
