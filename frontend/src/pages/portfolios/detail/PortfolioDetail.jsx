import { Outlet, useParams } from "react-router-dom";
import App from "../../../App";
import { LIST_CRUMBS } from "../../../helpers/breadcrumb.helpers";
import { useAncestryForChildren } from "../../../hooks/useBreadcrumbTrail.hooks";
import { useDetailFiscalYear, useSyncFiscalYearParam } from "../../../hooks/useDetailFiscalYear.hooks";
import {
    useGetPortfolioByIdQuery,
    useGetPortfolioFundingSummaryQuery,
    useGetPortfolioUrlByIdQuery,
    useGetProjectsByPortfolioQuery
} from "../../../api/opsAPI";
import PortfolioTabsSection from "../../../components/Portfolios/PortfolioTabsSection";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import { getTypesCounts } from "../../cans/detail/Can.helpers";
import PortfolioHero from "../../../components/Portfolios/PortfolioHero";

const PortfolioDetail = () => {
    // Shared with the CAN and project pages, so going back shows the FY last picked on any of them.
    const { fiscalYear: selectedFiscalYear, setFiscalYear: setSelectedFiscalYear } =
        useDetailFiscalYear(getCurrentFiscalYear());
    const fiscalYear = Number(selectedFiscalYear);
    useSyncFiscalYearParam(fiscalYear);
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id || "0");

    const { data: portfolio, isLoading: portfolioIsLoading } = useGetPortfolioByIdQuery(portfolioId);

    const { data: portfolioFunding, isLoading: portfolioFundingLoading } = useGetPortfolioFundingSummaryQuery({
        portfolioId,
        fiscalYear,
        refetchOnMountOrArgChange: true
    });

    const { data: projects } = useGetProjectsByPortfolioQuery({
        fiscal_year: fiscalYear,
        portfolio_id: portfolioId,
        refetchOnMountOrArgChange: true
    });
    const { data: portfolioUrl } = useGetPortfolioUrlByIdQuery(portfolioId);
    const projectTypesCount = getTypesCounts(projects ?? [], "project_type");

    // Compose the ancestry that child entry-point links (CanCard, CANBudgetLineTable)
    // should record. A portfolio is reached directly from the Portfolios list, so its
    // parent crumb is always the Portfolios list; the leaf is this portfolio, linking
    // back to the current tab and selected FY.
    const linkAncestry = useAncestryForChildren({
        ownCrumb: { label: portfolio?.name ?? "Portfolio", fiscalYear },
        fallbackCrumb: LIST_CRUMBS.portfolios
    });

    const isLoading = portfolioIsLoading || portfolioFundingLoading;

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <App breadCrumbName={portfolio?.name}>
            <div>
                <PortfolioHero
                    entityName={portfolio?.name}
                    divisionName={portfolio.division?.name}
                    label="Portfolio Description"
                    description={portfolio?.description}
                    teamLeaders={portfolio?.team_leaders}
                    divisionDirector={portfolio?.division_director}
                    deputyDivisionDirector={portfolio?.deputy_division_director}
                    url={portfolioUrl?.url}
                />
                <section className="display-flex flex-justify margin-top-3">
                    <PortfolioTabsSection portfolioId={portfolioId} />
                    <FiscalYear
                        fiscalYear={fiscalYear}
                        handleChangeFiscalYear={setSelectedFiscalYear}
                    />
                </section>
                <Outlet
                    context={{
                        portfolioId,
                        fiscalYear,
                        projectTypesCount,
                        newFunding: portfolioFunding?.new_funding.amount ?? 0,
                        carryForward: portfolioFunding?.carry_forward_funding.amount ?? 0,
                        totalFunding: portfolioFunding?.total_funding?.amount ?? 0,
                        inDraftFunding: portfolioFunding?.draft_funding?.amount ?? 0,
                        inExecutionFunding: portfolioFunding?.in_execution_funding?.amount ?? 0,
                        obligatedFunding: portfolioFunding?.obligated_funding?.amount ?? 0,
                        plannedFunding: portfolioFunding?.planned_funding?.amount ?? 0,
                        linkAncestry
                    }}
                />
            </div>
        </App>
    );
};

export default PortfolioDetail;
