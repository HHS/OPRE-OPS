import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetCanFilterOptionsQuery, useGetCanFundingSummaryQuery, useGetCansQuery } from "../../../api/opsAPI";
import App from "../../../App";
import CANSummaryCards from "../../../components/CANs/CANSummaryCards";
import CANTable from "../../../components/CANs/CANTable";
import CANTags from "../../../components/CANs/CanTabs";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import PaginationNav from "../../../components/UI/PaginationNav/PaginationNav";
import { getCurrentFiscalYear, codesToDisplayText } from "../../../helpers/utils";
import CANFilterButton from "./CANFilterButton";
import CANFilterTags from "./CANFilterTags";
import CANFiscalYearSelect from "./CANFiscalYearSelect";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";

import { ITEMS_PER_PAGE } from "../../../constants";

/**
 * Page for the CAN List.
 * @component
 * @typedef {import("../../../types/CANTypes").CAN} CAN
 * @returns {JSX.Element | boolean} - The component JSX.
 */
const CanList = () => {
    const navigate = useNavigate();
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear());
    const fiscalYear = Number(selectedFiscalYear);
    const [currentPage, setCurrentPage] = React.useState(1); // 1-indexed for UI
    const [pageSize] = React.useState(ITEMS_PER_PAGE);
    const [filters, setFilters] = React.useState({
        activePeriod: [],
        transfer: [],
        portfolio: [],
        can: [],
        budget: []
    });

    // Extract filter values for API
    const activePeriodIds = filters.activePeriod?.map((ap) => ap.id) || [];
    const TRANSFER_METHOD_MAP = Object.fromEntries(
        Object.entries(codesToDisplayText.methodOfTransfer).map(([code, label]) => [label, code])
    );
    const transferTitles = filters.transfer?.map((t) => TRANSFER_METHOD_MAP[t.title] || t.title) || [];
    const portfolioAbbreviations = filters.portfolio?.map((p) => p.abbr) || [];
    const canIds = filters.can?.map((c) => c.id) || [];
    const budgetMin = filters.budget && filters.budget.length > 0 ? filters.budget[0] : undefined;
    const budgetMax = filters.budget && filters.budget.length > 1 ? filters.budget[1] : undefined;

    // Fetch paginated CANs for display
    const {
        data: cansResponse,
        isError,
        isLoading
    } = useGetCansQuery({
        fiscalYear: selectedFiscalYear,
        sortConditions: sortCondition,
        sortDescending,
        page: currentPage - 1, // Convert to 0-indexed for API
        limit: pageSize,
        // Filter parameters
        activePeriod: activePeriodIds,
        transfer: transferTitles,
        portfolio: portfolioAbbreviations,
        canIds,
        budgetMin,
        budgetMax
    });

    // Fetch filter options from dedicated endpoint
    const { data: filterOptionsData, isLoading: filterOptionsLoading } = useGetCanFilterOptionsQuery({
        fiscalYear: selectedFiscalYear
    });

    // Extract cans array and metadata from wrapped response
    const canList = cansResponse?.cans || [];
    const totalCount = cansResponse?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Reset to page 1 when filters or sort changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedFiscalYear, sortCondition, sortDescending, filters]);

    const { data: fundingSummaryData, isLoading: fundingSummaryIsLoading } = useGetCanFundingSummaryQuery({
        ids: [0],
        fiscalYear: fiscalYear,
        activePeriod: activePeriodIds,
        transfer: transferTitles,
        portfolio: portfolioAbbreviations,
        fyBudgets: filters.budget
    });

    // Derive filter options from the backend filter options endpoint
    const portfolioOptions = React.useMemo(() => {
        if (!filterOptionsData?.portfolios) return [];
        return filterOptionsData.portfolios.map((p) => ({
            id: p.id,
            title: `${p.name} (${p.abbreviation})`,
            abbr: p.abbreviation
        }));
    }, [filterOptionsData?.portfolios]);

    const canOptions = React.useMemo(() => {
        if (!filterOptionsData?.can_numbers) return [];
        return filterOptionsData.can_numbers.map((n) => ({
            id: n.id,
            title: n.number
        }));
    }, [filterOptionsData?.can_numbers]);

    const fyBudgetRange = React.useMemo(() => {
        if (!filterOptionsData?.fy_budget_range) return [0, 0];
        const { min, max } = filterOptionsData.fy_budget_range;
        if (min === max) {
            return [min * 0.9, max * 1.1];
        }
        return [min, max];
    }, [filterOptionsData?.fy_budget_range]);

    if (isLoading || fundingSummaryIsLoading || filterOptionsLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (isError) {
        navigate("/error");
        return;
    }

    return (
        <App breadCrumbName="CANs">
            <TablePageLayout
                title="CANs"
                subtitle="All CANs"
                details="This is a list of all CANs across OPRE that are or were active within the selected Fiscal Year."
                TabsSection={<CANTags />}
                TableSection={
                    <>
                        <CANTable
                            cans={canList}
                            fiscalYear={fiscalYear}
                            sortConditions={sortCondition}
                            sortDescending={sortDescending}
                            setSortConditions={setSortConditions}
                        />
                        {totalPages > 1 && (
                            <div className="margin-top-3">
                                <PaginationNav
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    setCurrentPage={setCurrentPage}
                                />
                            </div>
                        )}
                    </>
                }
                FilterButton={
                    <CANFilterButton
                        filters={filters}
                        setFilters={setFilters}
                        portfolioOptions={portfolioOptions}
                        canOptions={canOptions}
                        fyBudgetRange={fyBudgetRange}
                        disabled={!filterOptionsData}
                    />
                }
                FYSelect={
                    <CANFiscalYearSelect
                        fiscalYear={fiscalYear}
                        setSelectedFiscalYear={setSelectedFiscalYear}
                    />
                }
                FilterTags={
                    <CANFilterTags
                        filters={filters}
                        setFilters={setFilters}
                        fyBudgetRange={fyBudgetRange}
                    />
                }
                SummaryCardsSection={
                    <CANSummaryCards
                        fiscalYear={fiscalYear}
                        totalBudget={fundingSummaryData?.total_funding}
                        newFunding={fundingSummaryData?.new_funding}
                        carryForward={fundingSummaryData?.carry_forward_funding}
                        plannedFunding={fundingSummaryData?.planned_funding}
                        obligatedFunding={fundingSummaryData?.obligated_funding}
                        inExecutionFunding={fundingSummaryData?.in_execution_funding}
                    />
                }
            />
        </App>
    );
};

export default CanList;
