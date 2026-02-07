import { useEffect, useState } from "react";
import PacmanLoader from "react-spinners/PacmanLoader";
import App from "../../../App";
import {
    useGetBudgetLineItemsQuery,
    useLazyGetBudgetLineItemsQuery,
    useLazyGetPortfolioByIdQuery,
    useLazyGetProcurementShopsQuery,
    useLazyGetServicesComponentByIdQuery
} from "../../../api/opsAPI";
import AllBudgetLinesTable from "../../../components/BudgetLineItems/AllBudgetLinesTable";
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
import React from "react";
import { getCurrentFiscalYear } from "../../../helpers/utils";

/**
 * @component Page for the Budget Line Item List.
 * @returns {React.ReactElement} - The component JSX.
 */
const BudgetLineItemList = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [fiscalYearShortcut, setFiscalYearShortcut] = React.useState(getCurrentFiscalYear());
    const [isFiscalYearShortcutActive, setIsFiscalYearShortcutActive] = React.useState(false);
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();
    const { myBudgetLineItemsUrl, filters, setFilters } = useBudgetLinesList();
    const previousFiscalYearsRef = React.useRef(filters.fiscalYears);

    useEffect(() => {
        if (filters.fiscalYears === undefined) {
            setIsFiscalYearShortcutActive(false);
            setFiscalYearShortcut(getCurrentFiscalYear());
        } else if (filters.fiscalYears === null) {
            setIsFiscalYearShortcutActive(false);
            setFiscalYearShortcut("All");
        } else if ((filters.fiscalYears ?? []).length > 1) {
            setIsFiscalYearShortcutActive(false);
            setFiscalYearShortcut("Multi");
        } else if ((filters.fiscalYears ?? []).length === 1) {
            setIsFiscalYearShortcutActive(false);
            setFiscalYearShortcut(filters.fiscalYears[0].id);
        } else if ((filters.fiscalYears ?? []).length === 0 && !isFiscalYearShortcutActive) {
            setFiscalYearShortcut(getCurrentFiscalYear());
        } else if (fiscalYearShortcut === "Multi" || fiscalYearShortcut === "All") {
            // Reset to current fiscal year when filters are cleared
            setFiscalYearShortcut(getCurrentFiscalYear());
        }
    }, [filters.fiscalYears, fiscalYearShortcut, isFiscalYearShortcutActive]);

    useEffect(() => {
        const previousFiscalYears = previousFiscalYearsRef.current;
        previousFiscalYearsRef.current = filters.fiscalYears;

        const hadSelections = Array.isArray(previousFiscalYears) && previousFiscalYears.length > 0;
        const isCleared = Array.isArray(filters.fiscalYears) && filters.fiscalYears.length === 0;

        if (hadSelections && isCleared) {
            setIsFiscalYearShortcutActive(false);
            setFiscalYearShortcut(getCurrentFiscalYear());
        }
    }, [filters.fiscalYears]);

    // Handle fiscal year change - clear filters if changing from "Multi" to a specific year
    const handleChangeFiscalYear = (newValue) => {
        setFilters({
            fiscalYears: newValue === "All" ? null : [],
            portfolios: [],
            bliStatus: [],
            budgetRange: null,
            agreementTypes: [],
            agreementTitles: [],
            canActivePeriods: []
        });
        setIsFiscalYearShortcutActive(true);
        setFiscalYearShortcut(newValue);
    };

    /** @type {Array<{id: number | string, title: number | string}> | null | undefined} */
    let resolvedFiscalYears = filters.fiscalYears;
    const currentFiscalYear = getCurrentFiscalYear();
    if (filters.fiscalYears === null) {
        resolvedFiscalYears = null;
    } else if (filters.fiscalYears === undefined) {
        resolvedFiscalYears = [{ id: currentFiscalYear, title: currentFiscalYear }];
    } else if ((filters.fiscalYears ?? []).length === 0) {
        const fallbackFiscalYear = isFiscalYearShortcutActive ? fiscalYearShortcut : currentFiscalYear;
        resolvedFiscalYears = [{ id: Number(fallbackFiscalYear), title: Number(fallbackFiscalYear) }];
    }

    /** @type {{data?: import("../../../types/BudgetLineTypes").BudgetLine[] | undefined, isError: boolean, isLoading: boolean}} */
    const {
        data: budgetLineItems,
        isError: budgetLineItemsError,
        isLoading: budgetLineItemsIsLoading
    } = useGetBudgetLineItemsQuery({
        filters: {
            ...filters,
            fiscalYears: resolvedFiscalYears,
            budgetLineTotalMin: filters.budgetRange ? filters.budgetRange[0] : undefined,
            budgetLineTotalMax: filters.budgetRange ? filters.budgetRange[1] : undefined
        },
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
    const [procShopTrigger] = useLazyGetProcurementShopsQuery();
    const [portfolioTrigger] = useLazyGetPortfolioByIdQuery();

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    if (budgetLineItemsIsLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
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
                    <>
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
                    </>
                }
                FilterButton={
                    <>
                        <div className="display-flex">
                            <div>
                                {budgetLineItems && budgetLineItems?.length > 0 && (
                                    <button
                                        style={{ fontSize: "16px" }}
                                        className="usa-button--unstyled text-primary display-flex flex-align-end cursor-pointer"
                                        data-cy="budget-line-export"
                                        onClick={() =>
                                            handleExport(
                                                exportTableToXlsx,
                                                setIsExporting,
                                                filters,
                                                budgetLineItems,
                                                budgetLineTrigger,
                                                procShopTrigger,
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
                                    selectedFiscalYear={fiscalYearShortcut}
                                />
                            </div>
                        </div>
                    </>
                }
                FYSelect={
                    <FiscalYear
                        fiscalYear={fiscalYearShortcut}
                        handleChangeFiscalYear={handleChangeFiscalYear}
                    />
                }
                SummaryCardsSection={
                    budgetLineItems &&
                    budgetLineItems?.length > 0 && (
                        <SummaryCardsSection
                            totalAmount={budgetLineItems?.[0]?._meta?.total_amount ?? 0}
                            totalDraftAmount={budgetLineItems?.[0]?._meta?.total_draft_amount ?? 0}
                            totalPlannedAmount={budgetLineItems?.[0]?._meta?.total_planned_amount ?? 0}
                            totalExecutingAmount={budgetLineItems?.[0]?._meta?.total_in_execution_amount ?? 0}
                            totalObligatedAmount={budgetLineItems?.[0]?._meta?.total_obligated_amount ?? 0}
                            fiscalYear={fiscalYearShortcut}
                        />
                    )
                }
            />
        </App>
    );
};

export default BudgetLineItemList;
