import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetCanFundingSummaryQuery, useGetCansQuery } from "../../../api/opsAPI";
import App from "../../../App";
import CANSummaryCards from "../../../components/CANs/CANSummaryCards";
import CANTable from "../../../components/CANs/CANTable";
import CANTags from "../../../components/CANs/CanTabs";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import PaginationNav from "../../../components/UI/PaginationNav/PaginationNav";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import CANFilterButton from "./CANFilterButton";
import CANFilterTags from "./CANFilterTags";
import CANFiscalYearSelect from "./CANFiscalYearSelect";
import { getPortfolioOptions, getSortedFYBudgets } from "./CanList.helpers";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";

/**
 * Page for the CAN List.
 * @component
 * @typedef {import("../../../types/CANTypes").CAN} CAN
 * @returns {JSX.Element | boolean} - The component JSX.
 */
const CanList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();
    const myCANsUrl = searchParams.get("filter") === "my-cans";
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear());
    const fiscalYear = Number(selectedFiscalYear);
    const [currentPage, setCurrentPage] = React.useState(1); // 1-indexed for UI
    const [pageSize] = React.useState(import.meta.env.PROD ? 25 : 10);
    const [filters, setFilters] = React.useState({
        activePeriod: [],
        transfer: [],
        portfolio: [],
        budget: []
    });

    // Extract filter values for API
    const activePeriodIds = filters.activePeriod?.map((ap) => ap.id) || [];
    const transferTitles = filters.transfer?.map((t) => t.title.toUpperCase()) || [];
    const portfolioAbbreviations = filters.portfolio?.map((p) => p.abbr) || [];
    const budgetMin = filters.budget && filters.budget.length > 0 ? filters.budget[0] : undefined;
    const budgetMax = filters.budget && filters.budget.length > 1 ? filters.budget[1] : undefined;

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
        budgetMin,
        budgetMax,
        myCans: myCANsUrl
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

    // Note: Filtering and sorting are now done server-side in the useGetCansQuery call above
    const portfolioOptions = getPortfolioOptions(canList);
    const sortedFYBudgets = getSortedFYBudgets(canList, fiscalYear);
    const [minFYBudget, maxFYBudget] = [sortedFYBudgets[0], sortedFYBudgets[sortedFYBudgets.length - 1]];

    if (isLoading || fundingSummaryIsLoading) {
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
                subtitle={myCANsUrl ? "My CANs" : "All CANs"}
                details={
                    myCANsUrl
                        ? "This is a list of CANs from agreements you are listed as a team member on. Please select filter options to see CANs by Portfolio, Fiscal Year, or other criteria."
                        : "This is a list of all CANs across OPRE that are or were active within the selected Fiscal Year."
                }
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
                        fyBudgetRange={[minFYBudget, maxFYBudget]}
                        disabled={canList.length === 0}
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
                        fyBudgetRange={[minFYBudget, maxFYBudget]}
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
