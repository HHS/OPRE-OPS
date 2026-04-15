import { useEffect, useMemo, useState } from "react";
import { PacmanLoader } from "react-spinners";
import App from "../../../App";
import {
    useGetBudgetLineItemsQuery,
    useLazyGetBudgetLineItemsQuery,
    useLazyGetPortfolioByIdQuery,
    useLazyGetServicesComponentByIdQuery
} from "../../../api/opsAPI";
import AllBudgetLinesTable from "../../../components/BudgetLineItems/AllBudgetLinesTable";
import AllBudgetLinesTableLoading from "../../../components/BudgetLineItems/AllBudgetLinesTable/AllBudgetLinesTableLoading";
import SummaryCardsSection from "../../../components/BudgetLineItems/SummaryCardsSection";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import { ITEMS_PER_PAGE } from "../../../constants";
import { handleExport } from "../../../helpers/budgetLines.helpers";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers.js";
import icons from "../../../uswds/img/sprite.svg";
import BLIFilterButton from "./BLIFilterButton";
import BLIFilterTags from "./BLIFilterTags";
import BLITags from "./BLITabs";
import { useBudgetLinesList } from "./BudgetLinesItems.hooks";
import FiscalYear from "../../../components/UI/FiscalYear";

/**
 * @component Page for the Budget Line Item List.
 * @returns {React.ReactElement} - The component JSX.
 */
const BudgetLineItemList = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();
    const { myBudgetLineItemsUrl, filters, setFilters, useApproachB, fyHelpers } = useBudgetLinesList();

    // ============================================
    // TEMPORARY: A/B Testing Fiscal Year Filter
    // Derive dropdown display value from filters using approach-specific helper
    // ============================================
    const fiscalYearDropdownValue = useMemo(
        () => fyHelpers.deriveDropdownValue(filters.fiscalYears),
        [filters.fiscalYears, fyHelpers]
    );

    // ============================================
    // TEMPORARY: A/B Testing - Different "All" handling
    // Approach A: "All" sets fiscalYears to null
    // Approach B: "All" sets fiscalYears to [{id: "all"}] (explicit selection)
    // ============================================
    const handleChangeFiscalYear = (selectedValue) => {
        if (selectedValue === "All") {
            if (useApproachB) {
                // Approach B: Explicit "All FYs" selection
                setFilters((prev) => ({
                    ...prev,
                    fiscalYears: [{ id: "all", title: "All FYs" }]
                }));
            } else {
                // Approach A: null = "All"
                setFilters((prev) => ({ ...prev, fiscalYears: null }));
            }
        } else {
            // Single year quick action
            const yearId = Number(selectedValue);
            setFilters((prev) => ({
                ...prev,
                fiscalYears: [{ id: yearId, title: yearId }]
            }));
        }
    };

    // Derive fiscal years for API query using approach-specific helper
    /** @type {Array<{id: number | string, title: number | string}> | null} */
    const resolvedFiscalYears = useMemo(
        () => fyHelpers.resolveForAPI(filters.fiscalYears),
        [filters.fiscalYears, fyHelpers]
    );

    // Resolve filters for both UI query and export - single source of truth
    const resolvedFilters = useMemo(
        () => ({
            ...filters,
            fiscalYears: resolvedFiscalYears,
            budgetLineTotalMin: filters.budgetRange ? filters.budgetRange[0] : undefined,
            budgetLineTotalMax: filters.budgetRange ? filters.budgetRange[1] : undefined
        }),
        [filters, resolvedFiscalYears]
    );

    /** @type {{data?: import("../../../types/BudgetLineTypes").BudgetLine[] | undefined, isError: boolean, isLoading: boolean}} */
    const {
        data: budgetLineItems,
        isError: budgetLineItemsError,
        isLoading: budgetLineItemsIsLoading,
        isFetching: budgetLineItemsIsFetching
    } = useGetBudgetLineItemsQuery({
        filters: resolvedFilters,
        page: currentPage - 1,
        onlyMy: myBudgetLineItemsUrl,
        includeFees: true,
        sortConditions: sortCondition,
        sortDescending: sortDescending,
        enableObe: false,
        refetchOnMountOrArgChange: true,
        limit: ITEMS_PER_PAGE
    });

    const [serviceComponentTrigger] = useLazyGetServicesComponentByIdQuery();
    const [budgetLineTrigger] = useLazyGetBudgetLineItemsQuery();
    const [portfolioTrigger] = useLazyGetPortfolioByIdQuery();
    const isTableLoading = budgetLineItemsIsLoading || budgetLineItemsIsFetching;

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    if (budgetLineItemsError) {
        return (
            <App>
                <h1>Oops, an error occurred</h1>
            </App>
        );
    }

    if (isExporting) {
        return (
            <div className="bg-white display-flex flex-column flex-align-center flex-justify-center padding-y-4 height-viewport">
                <h1 className="margin-bottom-2">Exporting...</h1>
                <PacmanLoader
                    size={25}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                />
            </div>
        );
    }

    return (
        <App breadCrumbName="Budget Lines">
            <TablePageLayout
                title="Budget Lines"
                subtitle={myBudgetLineItemsUrl ? "My Budget Lines" : "All Budget Lines"}
                details="This is a list of budget lines across all OPRE for the selected fiscal year."
                TabsSection={<BLITags />}
                FilterTags={
                    <BLIFilterTags
                        filters={filters}
                        setFilters={setFilters}
                        fyHelpers={fyHelpers}
                    />
                }
                TableSection={
                    isTableLoading ? (
                        <AllBudgetLinesTableLoading />
                    ) : (
                        <AllBudgetLinesTable
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            budgetLineItems={budgetLineItems ?? []}
                            budgetLineItemsError={budgetLineItemsError}
                            budgetLineItemsIsLoading={budgetLineItemsIsLoading}
                            sortConditions={sortCondition}
                            sortDescending={sortDescending}
                            setSortConditions={setSortConditions}
                        />
                    )
                }
                FilterButton={
                    <>
                        <div className="display-flex">
                            <div>
                                {budgetLineItems && budgetLineItems?.length > 0 && (
                                    <button
                                        type="button"
                                        style={{ fontSize: "16px" }}
                                        className="usa-button--unstyled text-primary display-flex flex-align-end cursor-pointer"
                                        data-cy="budget-line-export"
                                        onClick={() =>
                                            handleExport(
                                                exportTableToXlsx,
                                                setIsExporting,
                                                resolvedFilters,
                                                budgetLineItems,
                                                budgetLineTrigger,
                                                serviceComponentTrigger,
                                                portfolioTrigger
                                            )
                                        }
                                    >
                                        <svg
                                            className={`height-2 width-2 margin-right-05`}
                                            style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                                        >
                                            <use href={`${icons}#save_alt`}></use>
                                        </svg>
                                        <span>Export</span>
                                    </button>
                                )}
                            </div>
                            <div className="margin-left-205">
                                <BLIFilterButton
                                    filters={filters}
                                    setFilters={setFilters}
                                    selectedFiscalYear={fiscalYearDropdownValue}
                                    useApproachB={useApproachB}
                                />
                            </div>
                        </div>
                    </>
                }
                FYSelect={
                    <FiscalYear
                        fiscalYear={fiscalYearDropdownValue}
                        handleChangeFiscalYear={handleChangeFiscalYear}
                        showAllOption={fiscalYearDropdownValue !== "All"}
                    />
                }
                SummaryCardsSection={
                    !isTableLoading &&
                    budgetLineItems &&
                    budgetLineItems?.length > 0 && (
                        <SummaryCardsSection
                            totalAmount={budgetLineItems?.[0]?._meta?.total_amount ?? 0}
                            totalDraftAmount={budgetLineItems?.[0]?._meta?.total_draft_amount ?? 0}
                            totalPlannedAmount={budgetLineItems?.[0]?._meta?.total_planned_amount ?? 0}
                            totalExecutingAmount={budgetLineItems?.[0]?._meta?.total_in_execution_amount ?? 0}
                            totalObligatedAmount={budgetLineItems?.[0]?._meta?.total_obligated_amount ?? 0}
                            fiscalYear={fiscalYearDropdownValue === "All" ? "All FYs" : fiscalYearDropdownValue}
                        />
                    )
                }
            />
        </App>
    );
};

export default BudgetLineItemList;
