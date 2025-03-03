import React from "react";
import { Outlet, useParams } from "react-router-dom";
import App from "../../../App";
import {
    useGetCanFundingSummaryQuery,
    useGetPortfolioByIdQuery,
    useGetPortfolioCansByIdQuery,
    useGetPortfolioFundingSummaryQuery,
    useGetProjectsByPortfolioQuery
} from "../../../api/opsAPI";
import PortfolioTabsSection from "../../../components/Portfolios/PortfolioTabsSection";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import Hero from "../../../components/UI/Hero/Hero";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import { getTypesCounts } from "../../cans/detail/Can.helpers";

const PortfolioDetail = () => {
    /**
     * @typedef {import("../../../components/CANs/CANTypes").FundingSummary} FundingSummary
     */
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear());
    const fiscalYear = Number(selectedFiscalYear);
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id || "0");

    const { data: portfolio, isLoading: portfolioIsLoading } = useGetPortfolioByIdQuery(portfolioId);
    const { data: portfolioCans, isLoading: portfolioCansLoading } = useGetPortfolioCansByIdQuery({
        portfolioId,
        // year: fiscalYear, // TODO: disabling fiscalYear for now pending completion of #3531
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
    const projectTypesCount = getTypesCounts(projects ?? [], "project_type");

    /**
     * Filter CANs by fiscal year and extract their IDs
     * @type {number[]}
     */
    const canIds =
        portfolioCans
            ?.filter(
                /** @param {import("../../../components/CANs/CANTypes").CAN} can */
                (can) => can.funding_budgets?.some((budget) => budget.fiscal_year === fiscalYear)
            )
            .map(
                /** @param {{id: number}} can */
                (can) => can.id
            ) ?? [];
    /** @type {{data?: FundingSummary | undefined, isLoading: boolean}} */
    const { data: CANFunding } = useGetCanFundingSummaryQuery({
        ids: canIds,
        fiscalYear: fiscalYear,
        refetchOnMountOrArgChange: true
    });

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
                        newFunding: CANFunding?.new_funding ?? 0, // TODO: update this upon completion of #3536
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
