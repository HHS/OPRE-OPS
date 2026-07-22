import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import icons from "../../uswds/img/sprite.svg";
import App from "../../App";
import TablePageLayout from "../../components/Layouts/TablePageLayout";
import { useGetDivisionsQuery, useGetProcurementShopsQuery } from "../../api/opsAPI";
import { useGetAllProcurementTrackers } from "../../hooks/useGetAllProcurementTrackers";
import { useGetAllAgreements } from "../../hooks/useGetAllAgreements";
import { BLI_STATUS } from "../../helpers/budgetLines.helpers";
import { exportMultiSheetToXlsx } from "../../helpers/tableExport.helpers";
import { getCurrentFiscalYear } from "../../helpers/utils";
import ProcurementDashboardFilterButton from "./ProcurementDashboardFilterButton";
import ProcurementDashboardFilterTags from "./ProcurementDashboardFilterTags";
import ProcurementDashboardTabs from "./summary/ProcurementDashboardTabs";
import ProcurementSummaryCards from "./summary/ProcurementSummaryCards";
import ProcurementDetails from "./details/ProcurementDetails";

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

    const [filters, setFilters] = useState({ procShop: [], division: [] });

    const { data: procurementShops = [] } = useGetProcurementShopsQuery();
    const { data: divisions = [] } = useGetDivisionsQuery({});

    const { agreements, metadata, isLoading, error } = useGetAllAgreements({
        filters: {
            fiscalYear: [CURRENT_FISCAL_YEAR],
            includeProcurement: true,
            ...(awardTypeFilter ? { awardType: [{ awardType: awardTypeFilter }] } : {}),
            ...(filters.procShop?.length ? { awardingEntityId: filters.procShop.map((s) => s.id) } : {}),
            ...(filters.division?.length ? { division: filters.division.map((d) => d.id) } : {})
        }
    });

    const procurementOverview = metadata?.procurement_overview ?? null;
    const procurementStepSummary = metadata?.procurement_step_summary ?? null;
    const procurementDaysInStep = metadata?.procurement_days_in_step ?? null;

    const agreementIds = useMemo(() => agreements.map((a) => a.id), [agreements]);

    const { procurementTrackers } = useGetAllProcurementTrackers(agreementIds, { skip: agreementIds.length === 0 });

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
            "BLI Amount",
            "Fees",
            "Total"
        ];
        const currencyColumns = [8, 9, 10];

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
                    const amount = bli.amount ?? 0;
                    const fees = bli.fees ?? 0;
                    rows.push([
                        agreement.id,
                        agreement.name ?? "",
                        agreement.agreement_type ?? "",
                        agreement.procurement_shop?.abbr ?? "",
                        agreement.award_type ?? "",
                        stepNumber,
                        bli.id,
                        bli.fiscal_year,
                        amount,
                        fees,
                        amount + fees
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
                FilterButton={
                    <div className="display-flex">
                        <div>
                            <button
                                type="button"
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
                        </div>
                        <div className="margin-left-205">
                            <ProcurementDashboardFilterButton
                                filters={filters}
                                setFilters={setFilters}
                                procShopOptions={procurementShops}
                                divisionOptions={divisions}
                            />
                        </div>
                    </div>
                }
                FilterTags={
                    <ProcurementDashboardFilterTags
                        filters={filters}
                        setFilters={setFilters}
                    />
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
            <ProcurementDetails
                fiscalYear={CURRENT_FISCAL_YEAR}
                agreements={agreements}
                procurementTrackers={procurementTrackers}
                procurementStepSummary={procurementStepSummary}
                procurementDaysInStep={procurementDaysInStep}
            />
        </App>
    );
};

export default ProcurementDashboard;
