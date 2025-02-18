import { useSelector } from "react-redux";
import { Outlet, useParams } from "react-router-dom";
import App from "../../../App";
import {
    useGetCanFundingSummaryQuery,
    useGetPortfolioByIdQuery,
    useGetPortfolioCalcFundingQuery,
    useGetPortfolioCansByIdQuery,
    useGetProjectsByPortfolioQuery
} from "../../../api/opsAPI";
import PortfolioTabsSection from "../../../components/Portfolios/PortfolioTabsSection";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import Hero from "../../../components/UI/Hero/Hero";
import { setSelectedFiscalYear } from "./portfolioSlice";
import DebugCode from "../../../components/DebugCode";
import { getTypesCounts } from "../../cans/detail/Can.helpers";

const PortfolioDetail = () => {
    /**
     * @typedef {import("../../../components/CANs/CANTypes").FundingSummary} FundingSummary
     */
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id || "0");
    const selectedFiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const fiscalYear = Number(selectedFiscalYear.value);
    const { data: portfolio, isLoading: portfolioIsLoading } = useGetPortfolioByIdQuery(portfolioId);
    const { data: portfolioCans, isLoading: portfolioCansLoading } = useGetPortfolioCansByIdQuery({
        portfolioId,
        year: fiscalYear
    });
    const { data: portfolioFunding, isLoading: portfolioFundingLoading } = useGetPortfolioCalcFundingQuery({
        portfolioId,
        fiscalYear
    });
    const budgetLineIds = [...new Set(portfolioCans?.flatMap((can) => can.budget_line_items))];

    const { data: projects } = useGetProjectsByPortfolioQuery({ fiscal_year: fiscalYear, portfolio_id: portfolioId });
    const projectTypesCount = getTypesCounts(projects ?? [], "project_type");

    const canIds = portfolioCans?.map((can) => can.id) ?? [];
    /** @type {{data?: FundingSummary | undefined, isLoading: boolean}} */
    const { data: CANFunding } = useGetCanFundingSummaryQuery({
        ids: canIds,
        fiscalYear: fiscalYear,
        refetchOnMountOrArgChange: true
    });

    const inDraftFunding = CANFunding?.in_draft_funding ?? 0;

    if (portfolioCansLoading || portfolioIsLoading || portfolioFundingLoading) {
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
                <Outlet
                    context={{
                        fiscalYear,
                        budgetLineIds,
                        projectTypesCount,
                        portfolioFunding,
                        inDraftFunding,
                        canIds
                    }}
                />
            </div>
            <DebugCode
                title="detail page"
                data={{ CANFunding }}
            />
        </App>
    );
};

export default PortfolioDetail;
