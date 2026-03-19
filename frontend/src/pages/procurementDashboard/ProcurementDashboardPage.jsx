import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import icons from "../../uswds/img/sprite.svg";
import App from "../../App";
import TablePageLayout from "../../components/Layouts/TablePageLayout";
import { useGetAgreementsQuery } from "../../api/opsAPI";
import ProcShopFilter from "./ProcShopFilter";
import ProcurementDashboardTabs from "./ProcurementDashboardTabs";
import ProcurementSummaryCards from "./ProcurementSummaryCards";

// TODO: Replace with 2026 once test data is available for that fiscal year
const CURRENT_FISCAL_YEAR = 2043;

const FILTER_TO_AWARD_TYPE = {
    "first-award": "NEW",
    modifications: "CONTINUING"
};

const ProcurementDashboard = () => {
    const { search } = useLocation();
    const filterParam = new URLSearchParams(search).get("filter");
    const awardTypeFilter = FILTER_TO_AWARD_TYPE[filterParam] ?? null;

    const {
        data: agreementsResponse,
        isLoading,
        error
    } = useGetAgreementsQuery({
        filters: {
            fiscalYear: [CURRENT_FISCAL_YEAR]
        }
    });

    const allAgreements = agreementsResponse?.agreements || [];
    const agreements = useMemo(() => {
        if (!awardTypeFilter) return allAgreements;
        return allAgreements.filter((agreement) => agreement.award_type === awardTypeFilter);
    }, [allAgreements, awardTypeFilter]);

    return (
        <App breadCrumbName="Procurement Dashboard">
            <TablePageLayout
                title="Procurement Dashboard"
                subtitle="Procurement Summary"
                details={`This is a summary of all agreements currently in procurement for FY ${CURRENT_FISCAL_YEAR}.`}
                TabsSection={<ProcurementDashboardTabs />}
                FYSelect={
                    <ProcShopFilter
                        value="all"
                        onChange={() => {}}
                    />
                }
                FilterButton={
                    <button
                        style={{ fontSize: "16px" }}
                        className="usa-button--unstyled text-primary display-flex flex-align-end cursor-pointer"
                        data-cy="procurement-export"
                        onClick={() => {}}
                    >
                        <svg
                            className="height-2 width-2 margin-right-05"
                            style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                        >
                            <use href={`${icons}#save_alt`}></use>
                        </svg>
                        <span>Export</span>
                    </button>
                }
                SummaryCardsSection={
                    <ProcurementSummaryCards
                        agreements={agreements}
                        fiscalYear={CURRENT_FISCAL_YEAR}
                        isLoading={isLoading}
                        error={error}
                    />
                }
            />
        </App>
    );
};

export default ProcurementDashboard;
