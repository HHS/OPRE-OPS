import React from "react";
import { Outlet, useParams } from "react-router-dom";
import App from "../../../App";
import {
    useGetPortfolioByIdQuery,
    useGetPortfolioCansByIdQuery,
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
    /**
     * @typedef {import("../../../types/CANTypes").FundingSummary} FundingSummary
     */
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear());
    const fiscalYear = Number(selectedFiscalYear);
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id || "0");

    const { data: portfolio, isLoading: portfolioIsLoading } = useGetPortfolioByIdQuery(portfolioId);
    const { data: portfolioCans, isLoading: portfolioCansLoading } = useGetPortfolioCansByIdQuery({
        portfolioId,
        budgetFiscalYear: fiscalYear,
        includeInactive: true,
        refetchOnMountOrArgChange: true
    });
    const { data: portfolioFunding, isLoading: portfolioFundingLoading } = useGetPortfolioFundingSummaryQuery({
        portfolioId,
        fiscalYear,
        refetchOnMountOrArgChange: true
    });
    const budgetLineIds = [...new Set(portfolioCans?.flatMap((can) => can.budget_line_items))];

    const { data: projects } = useGetProjectsByPortfolioQuery({
        fiscal_year: fiscalYear,
        portfolio_id: portfolioId,
        refetchOnMountOrArgChange: true
    });
    const { data: portfolioUrl } = useGetPortfolioUrlByIdQuery(portfolioId);
    const projectTypesCount = getTypesCounts(projects ?? [], "project_type");

    /**
     * Extract CANs by their IDs
     * @type {number[]}
     */
    const canIds =
        portfolioCans?.map(
            /** @param {{id: number}} can */
            (can) => can.id
        ) ?? [];
    /** @type {{data?: FundingSummary | undefined, isLoading: boolean}} */

    if (portfolioCansLoading || portfolioIsLoading || portfolioFundingLoading) {
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
                        canIds,
                        portfolioId,
                        fiscalYear,
                        budgetLineIds,
                        projectTypesCount,
                        newFunding: portfolioFunding?.new_funding.amount ?? 0,
                        carryForward: portfolioFunding?.carry_forward_funding.amount ?? 0,
                        totalFunding: portfolioFunding?.total_funding?.amount ?? 0,
                        inDraftFunding: portfolioFunding?.draft_funding?.amount ?? 0,
                        inExecutionFunding: portfolioFunding?.in_execution_funding?.amount ?? 0,
                        obligatedFunding: portfolioFunding?.obligated_funding?.amount ?? 0,
                        plannedFunding: portfolioFunding?.planned_funding?.amount ?? 0
                    }}
                />
            </div>
        </App>
    );
};

export default PortfolioDetail;
