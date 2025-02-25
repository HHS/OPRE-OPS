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
import { getTypesCounts } from "../../cans/detail/Can.helpers";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import React from "react";

const PortfolioDetail = () => {
    /**
     * @typedef {import("../../../components/CANs/CANTypes").FundingSummary} FundingSummary
     */
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear(new Date()));
    const fiscalYear = Number(selectedFiscalYear);
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id || "0");

    const { data: portfolio, isLoading: portfolioIsLoading } = useGetPortfolioByIdQuery(portfolioId);
    const { data: portfolioCans, isLoading: portfolioCansLoading } = useGetPortfolioCansByIdQuery({
        portfolioId,
        // year: fiscalYear, // disabling fiscalYear for now pending completion of #3531
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

    const canIds = portfolioCans?.map((can) => can.id) ?? [];
    /** @type {{data?: FundingSummary | undefined, isLoading: boolean}} */
    const { data: CANFunding } = useGetCanFundingSummaryQuery({
        ids: canIds,
        fiscalYear: fiscalYear,
        refetchOnMountOrArgChange: true
    });

    const inDraftFunding = CANFunding?.in_draft_funding ?? 0;
    const newFunding = CANFunding?.new_funding ?? 0;

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
                        portfolioId,
                        fiscalYear,
                        budgetLineIds,
                        projectTypesCount,
                        portfolioFunding,
                        inDraftFunding,
                        newFunding,
                        canIds
                    }}
                />
            </div>
        </App>
    );
};

export default PortfolioDetail;
