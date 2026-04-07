import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import icons from "../../uswds/img/sprite.svg";
import App from "../../App";
import TablePageLayout from "../../components/Layouts/TablePageLayout";
import {
    useGetAgreementsQuery,
    useGetProcurementShopsQuery,
    useGetProcurementTrackersByAgreementIdsQuery
} from "../../api/opsAPI";
import { BLI_STATUS } from "../../helpers/budgetLines.helpers";
import { exportMultiSheetToXlsx } from "../../helpers/tableExport.helpers";
import { getCurrentFiscalYear } from "../../helpers/utils";
import ProcShopFilter from "./ProcShopFilter";
import ProcurementDashboardTabs from "./ProcurementDashboardTabs";
import ProcurementSummaryCards from "./ProcurementSummaryCards";

const CURRENT_FISCAL_YEAR = Number(getCurrentFiscalYear());

// TODO: Currently unused — the "First Award" and "Modifications" tabs are disabled.
// This mapping will be active once those tabs are enabled.
const FILTER_TO_AWARD_TYPE = {
    "first-award": "NEW",
    modifications: "CONTINUING"
};

const ProcurementDashboard = () => {
    const { search } = useLocation();
    const filterParam = new URLSearchParams(search).get("filter");
    const awardTypeFilter = FILTER_TO_AWARD_TYPE[filterParam] ?? null;

    const [selectedProcShop, setSelectedProcShop] = useState("all");

    const { data: procurementShops = [] } = useGetProcurementShopsQuery();

    const procShopIdMap = useMemo(() => {
        const map = {};
        for (const shop of procurementShops) {
            map[shop.abbr] = shop.id;
        }
        return map;
    }, [procurementShops]);

    const procShopOptions = useMemo(() => procurementShops.map((s) => s.abbr).sort(), [procurementShops]);

    const selectedProcShopId = selectedProcShop !== "all" ? procShopIdMap[selectedProcShop] : null;

    const {
        data: agreementsResponse,
        isLoading,
        error
    } = useGetAgreementsQuery({
        filters: {
            fiscalYear: [CURRENT_FISCAL_YEAR],
            ...(awardTypeFilter ? { awardType: [{ awardType: awardTypeFilter }] } : {}),
            ...(selectedProcShopId ? { awardingEntityId: [selectedProcShopId] } : {})
        },
        page: 0,
        limit: 50
    });

    const agreements = useMemo(() => agreementsResponse?.agreements || [], [agreementsResponse]);
    const procurementOverview = agreementsResponse?.procurement_overview ?? null;
    const procurementStepSummary = agreementsResponse?.procurement_step_summary ?? null;

    const agreementIds = useMemo(() => agreements.map((a) => a.id), [agreements]);

    const { data: procurementTrackers = [] } = useGetProcurementTrackersByAgreementIdsQuery(agreementIds, {
        skip: agreementIds.length === 0
    });

    const handleExport = useCallback(() => {
        // Build a lookup from agreement ID to its active procurement step number
        const stepByAgreementId = {};
        for (const tracker of procurementTrackers) {
            stepByAgreementId[tracker.agreement_id] = tracker.active_step_number;
        }

        const headers = [
            "Agreement ID",
            "Agreement Name",
            "Agreement Type",
            "Procurement Shop",
            "Award Type",
            "Procurement Step",
            "BLI ID",
            "Fiscal Year",
            "BLI Amount"
        ];
        const currencyColumns = [8];

        // Map each agreement + BLI combination into a flat row
        const mapAgreementRows = (agreementList) => {
            const rows = [];
            for (const agreement of agreementList) {
                const stepNumber = stepByAgreementId[agreement.id] ?? "";
                const blis = (agreement.budget_line_items || []).filter(
                    (bli) => bli.fiscal_year === CURRENT_FISCAL_YEAR && bli.status === BLI_STATUS.EXECUTING
                );

                if (blis.length === 0) continue;

                for (const bli of blis) {
                    rows.push([
                        agreement.id,
                        agreement.name ?? "",
                        agreement.agreement_type ?? "",
                        agreement.procurement_shop?.abbr ?? "",
                        agreement.award_type ?? "",
                        stepNumber,
                        bli.id,
                        bli.fiscal_year,
                        bli.amount ?? 0
                    ]);
                }
            }
            return rows;
        };

        // Create a sheet for each procurement step (1–6) plus an "All" sheet
        const allRows = mapAgreementRows(agreements);

        const stepSheets = [1, 2, 3, 4, 5, 6].map((step) => ({
            name: `Step ${step}`,
            headers,
            rows: allRows.filter((row) => row[5] === step),
            currencyColumns
        }));

        const sheets = [{ name: "All", headers, rows: allRows, currencyColumns }, ...stepSheets];

        exportMultiSheetToXlsx({
            sheets,
            filename: `Procurement_Dashboard_FY${CURRENT_FISCAL_YEAR}`
        });
    }, [agreements, procurementTrackers]);

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
                        onClick={handleExport}
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
                        procurementOverview={procurementOverview}
                        procurementStepSummary={procurementStepSummary}
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
