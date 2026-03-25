import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import icons from "../../uswds/img/sprite.svg";
import App from "../../App";
import TablePageLayout from "../../components/Layouts/TablePageLayout";
import { useGetAgreementsQuery, useGetProcurementTrackersByAgreementIdsQuery } from "../../api/opsAPI";
import { BLI_STATUS } from "../../helpers/budgetLines.helpers";
import { exportMultiSheetToXlsx } from "../../helpers/tableExport.helpers";
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
            // "BLI Fees",
            // "BLI Status"
        ];
        const currencyColumns = [8, 9];

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
                        bli.amount ?? 0,
                        bli.fees ?? 0,
                        bli.status ?? ""
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
