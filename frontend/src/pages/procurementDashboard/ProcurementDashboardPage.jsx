import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import icons from "../../uswds/img/sprite.svg";
import App from "../../App";
import TablePageLayout from "../../components/Layouts/TablePageLayout";
import { useGetAgreementsQuery, useGetProcurementTrackersByAgreementIdsQuery } from "../../api/opsAPI";
import ProcShopFilter from "./ProcShopFilter";
import ProcurementDashboardTabs from "./ProcurementDashboardTabs";
import ProcurementSummaryCards from "./ProcurementSummaryCards";

// TODO: Replace with 2026 once test data is available for that fiscal year
const CURRENT_FISCAL_YEAR = 2044;

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

    const [selectedProcShop, setSelectedProcShop] = useState("all");

    const allAgreements = agreementsResponse?.agreements || [];

    const procShopOptions = useMemo(
        () => [...new Set(allAgreements.map((a) => a.procurement_shop?.abbr).filter(Boolean))].sort(),
        [allAgreements]
    );

    const agreements = useMemo(() => {
        let filtered = allAgreements;
        if (awardTypeFilter) {
            filtered = filtered.filter((agreement) => agreement.award_type === awardTypeFilter);
        }
        if (selectedProcShop !== "all") {
            filtered = filtered.filter((agreement) => agreement.procurement_shop?.abbr === selectedProcShop);
        }
        return filtered;
    }, [allAgreements, awardTypeFilter, selectedProcShop]);

    const agreementIds = useMemo(() => agreements.map((a) => a.id), [agreements]);

    const { data: procurementTrackers = [] } = useGetProcurementTrackersByAgreementIdsQuery(agreementIds, {
        skip: agreementIds.length === 0
    });

    return (
        <App breadCrumbName="Procurement Dashboard">
            <TablePageLayout
                title="Procurement Dashboard"
                subtitle="Procurement Summary"
                details={`This is a summary of all agreements currently in procurement for FY ${CURRENT_FISCAL_YEAR}.`}
                TabsSection={<ProcurementDashboardTabs />}
                FYSelect={
                    <ProcShopFilter
                        value={selectedProcShop}
                        onChange={setSelectedProcShop}
                        options={procShopOptions}
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
                        procurementTrackers={procurementTrackers}
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
