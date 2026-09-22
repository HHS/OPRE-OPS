import { useEffect, useRef, useMemo, useState } from "react";
import { PacmanLoader } from "react-spinners";
import App from "../../../App";
import {
    useGetBudgetLineItemsQuery,
    useGetBudgetLineItemsFilterOptionsQuery,
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
import { deriveDropdownValue, resolveForAPI } from "../../../helpers/fiscalYearFilter.helpers";
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
    const {
        myBudgetLineItemsUrl,
        filters,
        setFilters,
        selectedFiscalYear,
        setSelectedFiscalYear,
        showModal,
        setShowModal
    } = useBudgetLinesList();

    /** @type {{data?: import("../../../types/BudgetLineTypes").Filters | undefined}} */
    const { data: bliFilterOptions } = useGetBudgetLineItemsFilterOptionsQuery({
        onlyMy: myBudgetLineItemsUrl,
        enableObe: false
    });

    // Derive dropdown display value and displayFY for child components.
    // "Multi" collapses to "All" for components that only understand "All" or a year string.
    const dropdownValue = deriveDropdownValue(selectedFiscalYear, filters.fiscalYears);
    const isMultiFY = dropdownValue === "Multi";
    const displayFY = isMultiFY ? "All" : dropdownValue;

    // Resolve filters for query and export — single source of truth.
    const resolvedFilters = useMemo(
        () => ({
            ...filters,
            fiscalYears: resolveForAPI(selectedFiscalYear, filters.fiscalYears),
            budgetLineTotalMin: filters.budgetRange ? filters.budgetRange[0] : undefined,
            budgetLineTotalMax: filters.budgetRange ? filters.budgetRange[1] : undefined
        }),
        [filters, selectedFiscalYear]
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

    // Track when the dropdown shortcut itself clears filters.fiscalYears so the effect
    // below doesn't revert selectedFiscalYear to "All" when the user changed the dropdown.
    const dropdownChangedFYRef = useRef(false);
    const prevFYLengthRef = useRef(0);

    // When all FY filter tags are explicitly removed (non-zero → zero, not from dropdown),
    // revert selectedFiscalYear to "All" per the business rule.
    // Normalize null (emitted by FiscalYearComboBox clear control) to [] before length checks.
    useEffect(() => {
        const normalizedFYs = filters.fiscalYears ?? [];
        const prevLen = prevFYLengthRef.current;
        prevFYLengthRef.current = normalizedFYs.length;
        if (dropdownChangedFYRef.current) {
            dropdownChangedFYRef.current = false;
            return;
        }
        if (normalizedFYs.length === 0 && prevLen > 0) {
            setSelectedFiscalYear("All");
        }
    }, [filters.fiscalYears, setSelectedFiscalYear]);

    // Reset FY_OBLIGATED sort whenever displayFY enters "All" mode from any cause.
    const prevDisplayFYRef = useRef(displayFY);
    useEffect(() => {
        const prev = prevDisplayFYRef.current;
        prevDisplayFYRef.current = displayFY;
        if (displayFY === "All" && prev !== "All" && sortCondition === "FY_OBLIGATED") {
            setSortConditions("AGREEMENT", false);
        }
    }, [displayFY, sortCondition, setSortConditions]);

    // Handle fiscal year shortcut dropdown change.
    // Clears only the Compare FYs override so other filters are preserved.
    const handleChangeFiscalYear = (selectedValue) => {
        dropdownChangedFYRef.current = true;
        setFilters((prev) => ({ ...prev, fiscalYears: [] }));
        setSelectedFiscalYear(selectedValue);
    };

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
                                    filterOptions={bliFilterOptions}
                                    showModal={showModal}
                                    setShowModal={setShowModal}
                                />
                            </div>
                        </div>
                    </>
                }
                FYSelect={
                    <FiscalYear
                        fiscalYear={dropdownValue}
                        handleChangeFiscalYear={handleChangeFiscalYear}
                        showAllOption={true}
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
                            fiscalYear={isMultiFY ? "Multi" : displayFY === "All" ? "All FYs" : displayFY}
                        />
                    )
                }
            />
        </App>
    );
};

export default BudgetLineItemList;
