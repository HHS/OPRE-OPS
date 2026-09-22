import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { PacmanLoader } from "react-spinners";
import {
    useGetAgreementsFilterOptionsQuery,
    useGetAgreementsQuery,
    useLazyGetAgreementsQuery,
    useLazyGetUserQuery
} from "../../../api/opsAPI.js";
import App from "../../../App";
import AgreementSummaryCardsSection from "../../../components/Agreements/AgreementSummaryCardsSection";
import AgreementsTable from "../../../components/Agreements/AgreementsTable";
import AgreementsTableLoading from "../../../components/Agreements/AgreementsTable/AgreementsTableLoading";
import {
    getAgreementContractNumber,
    getAgreementName,
    getProcurementShopDisplay,
    getResearchProjectName
} from "../../../components/Agreements/AgreementsTable/AgreementsTable.helpers";
import ChangeRequests from "../../../components/ChangeRequests";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import FiscalYear from "../../../components/UI/FiscalYear";
import PaginationNav from "../../../components/UI/PaginationNav/PaginationNav";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import { USER_ROLES } from "../../../components/Users/User.constants";
import constants, { ITEMS_PER_PAGE } from "../../../constants";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import { deriveDropdownValue, mergeFiscalYearOptions, resolveForAPI } from "../../../helpers/fiscalYearFilter.helpers";
import { convertCodeForDisplay, formatDate, tableSortCodes } from "../../../helpers/utils";
import icons from "../../../uswds/img/sprite.svg";
import AgreementsFilterButton from "./AgreementsFilterButton/AgreementsFilterButton";
import AgreementsFilterTags from "./AgreementsFilterTags/AgreementsFilterTags";
import AgreementTabs from "./AgreementsTabs";

/**
 * @typedef {import('../../../types/AgreementTypes').Agreement} Agreement
 */
/**
 * @component Page for the Agreements List.
 * @returns {React.ReactElement} - The component JSX.
 */
const AgreementsList = () => {
    const navigate = useNavigate();
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles) ?? [];
    const isBudgetTeam = userRoles.some((role) => role?.name === USER_ROLES.BUDGET_TEAM);
    const [isExporting, setIsExporting] = useState(false);
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        portfolio: [],
        fiscalYear: [],
        projectTitle: [],
        agreementType: [],
        agreementName: [],
        contractNumber: [],
        awardType: []
    });
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions(
        tableSortCodes.agreementCodes.AGREEMENT,
        false
    );
    const [currentPage, setCurrentPage] = useState(1); // 1-indexed for UI
    const [pageSize] = useState(ITEMS_PER_PAGE);
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState("All");

    const myAgreementsUrl = searchParams.get("filter") === "my-agreements";
    const changeRequestUrl = searchParams.get("filter") === "change-requests";

    const { data: agreementFilterOptions, isLoading: isLoadingAgreementFilterOptions } =
        useGetAgreementsFilterOptionsQuery({ onlyMy: myAgreementsUrl });

    // Derive the dropdown display value and the API-ready FY array from the two FY inputs:
    // selectedFiscalYear (shortcut dropdown) and filters.fiscalYear (Compare Fiscal Years panel).
    // Compare FYs takes precedence when non-empty; otherwise the dropdown FY is used.
    const dropdownValue = deriveDropdownValue(selectedFiscalYear, filters.fiscalYear);

    // A single Compare FY can fall outside the default rolling window (constants.fiscalYears),
    // e.g. an older year that still has agreements. Include every year the API knows about so
    // the <select>'s value always matches a rendered <option>.
    const fiscalYearOptions = mergeFiscalYearOptions(constants.fiscalYears, agreementFilterOptions?.fiscal_years);

    // Child components (AgreementsTable, AgreementsTableLoading, SummaryCardsSection, export)
    // only understand "All" or a specific year string — they have no "Multi" branch. Under
    // Multi, show lifetime_obligated columns and "Multiple Years" labels, same as "All".
    const isMultiFY = dropdownValue === "Multi";
    const displayFY = isMultiFY ? "All" : dropdownValue;

    const queryParams = {
        filters: {
            ...filters,
            fiscalYear: resolveForAPI(selectedFiscalYear, filters.fiscalYear)
        },
        onlyMy: myAgreementsUrl,
        sortConditions: sortCondition,
        sortDescending: sortDescending,
        page: currentPage - 1, // Convert to 0-indexed for API
        limit: pageSize
    };

    const {
        data: agreementsResponse,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
        isFetching: isFetchingAgreement
    } = useGetAgreementsQuery(queryParams, {
        refetchOnMountOrArgChange: true
    });

    const isTableLoading = isLoadingAgreement || isFetchingAgreement;

    // Extract agreements array and metadata from wrapped response
    const agreements = agreementsResponse?.agreements || [];
    const totalCount = agreementsResponse?.count || 0;
    const totals = agreementsResponse?.totals || null;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Reset to page 1 when filters or sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, myAgreementsUrl, sortCondition, sortDescending]);

    // Track when the dropdown shortcut itself clears filters.fiscalYear so the effect
    // below doesn't revert selectedFiscalYear to "All" when the user changed the dropdown.
    const dropdownChangedFYRef = useRef(false);

    // Track the previous length to distinguish "non-zero → zero" (tag removal) from
    // a no-op write of a new [] reference when the array was already empty
    // (e.g. Apply after Reset when no FY was selected). Combined with the ref guard,
    // this ensures we only revert to "All" when the user explicitly removes all FY tags.
    const prevFYLengthRef = useRef(0);

    // When all FY filter tags are explicitly removed (non-zero → zero, not from dropdown),
    // revert selectedFiscalYear to "All" per the business rule.
    // Normalize null (emitted by FiscalYearComboBox clear control) to [] before length checks.
    useEffect(() => {
        const normalizedFYs = filters.fiscalYear ?? [];
        const prevLen = prevFYLengthRef.current;
        prevFYLengthRef.current = normalizedFYs.length;
        if (dropdownChangedFYRef.current) {
            dropdownChangedFYRef.current = false;
            return;
        }
        if (normalizedFYs.length === 0 && prevLen > 0) {
            setSelectedFiscalYear("All");
        }
    }, [filters.fiscalYear]);

    // FY_OBLIGATED is meaningless when showing all/multiple fiscal years — reset the sort
    // to the default whenever that happens. Shared by the displayFY effect below (covers
    // panel sentinel, Multi, and tag removal) and handleChangeFiscalYear (covers the dropdown
    // re-selecting "All" while already on "All", which isn't a displayFY transition).
    const resetFYObligatedSort = () => {
        if (sortCondition === tableSortCodes.agreementCodes.FY_OBLIGATED) {
            setSortConditions(tableSortCodes.agreementCodes.AGREEMENT, false);
        }
    };

    // Reset FY_OBLIGATED sort whenever displayFY enters "All" mode (All FYs or Multi)
    // from any cause — dropdown shortcut, panel sentinel, Multi, or tag removal.
    const prevDisplayFYRef = useRef(displayFY);
    useEffect(() => {
        const prev = prevDisplayFYRef.current;
        prevDisplayFYRef.current = displayFY;
        if (displayFY === "All" && prev !== "All") {
            resetFYObligatedSort();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayFY]);

    // Handle fiscal year shortcut dropdown change.
    // Clears only the Compare FYs override so portfolio/type/etc. filters are preserved.
    const handleChangeFiscalYear = (newValue) => {
        dropdownChangedFYRef.current = true;
        setFilters((prev) => ({ ...prev, fiscalYear: [] }));
        setSelectedFiscalYear(newValue);
        if (newValue === "All") {
            resetFYObligatedSort();
        }
    };

    const [trigger] = useLazyGetUserQuery();
    const [getAllAgreementsTrigger] = useLazyGetAgreementsQuery();

    if (isLoadingAgreement && changeRequestUrl) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (errorAgreement) {
        navigate("/error");
        return;
    }

    let subtitle = "All Agreements";
    let details =
        "This is a list of all agreements across OPRE for the selected fiscal year. Draft budget lines are not included in the Totals.";
    if (myAgreementsUrl) {
        subtitle = "My Agreements";
        details =
            "This is a list of agreements you are listed as a Team Member on.  Draft budget lines are not included in the Totals.";
    }
    if (changeRequestUrl) {
        subtitle = "For Review";
        details = isBudgetTeam
            ? "This is a list of agreements that have changes pending your review. This list could include Pre-Award Requisitions and Award."
            : "This is a list of changes within your Division that require your review and approval. This list could include requests for budget changes, status changes or actions taking place during the procurement process.";
    }

    const handleExport = async () => {
        try {
            setIsExporting(true);

            // Fetch ALL agreements for export in batches (backend limit is 50)
            const maxLimit = 50;
            const totalPages = Math.ceil(totalCount / maxLimit);
            const fetchPromises = [];

            // Create promises for all pages
            for (let page = 0; page < totalPages; page++) {
                fetchPromises.push(
                    getAllAgreementsTrigger({
                        filters: {
                            ...filters,
                            fiscalYear: resolveForAPI(selectedFiscalYear, filters.fiscalYear)
                        },
                        onlyMy: myAgreementsUrl,
                        sortConditions: sortCondition,
                        sortDescending: sortDescending,
                        page: page,
                        limit: maxLimit
                    }).unwrap()
                );
            }

            // Fetch all pages in parallel
            const allResponses = await Promise.all(fetchPromises);

            // Combine all agreements from all pages
            const allAgreementsList = allResponses.flatMap((response) => response?.agreements || []);

            const corPromises = allAgreementsList
                .filter((agreement) => agreement?.project_officer_id)
                .map((agreement) => trigger(agreement.project_officer_id).unwrap());

            const corResponses = await Promise.all(corPromises);

            /** @type {Record<number, {cor: string}>} */
            const agreementDataMap = {};
            allAgreementsList.forEach((agreement) => {
                const corData = corResponses.find((cor) => cor.id === agreement.project_officer_id);

                agreementDataMap[agreement.id] = {
                    cor: corData?.display_name ?? corData?.full_name ?? "TBD"
                };
            });
            // displayFY collapses "Multi" → "All" so export columns match the table columns.
            const isAllFY = displayFY === "All";
            const fyLabel = isAllFY ? "Lifetime Obligated" : `FY${displayFY.slice(-2)} Obligated`;

            // The "Lifetime Obligated" column is omitted when "All" FYs is selected because the
            // fyLabel column above already shows lifetime_obligated — this avoids a duplicate
            // column with identical data. Deriving headers/values/currencyColumns from one list
            // of column definitions keeps them from drifting out of sync with each other.
            const columnDefs = [
                { header: "Agreement", getValue: (agreement) => getAgreementName(agreement) },
                {
                    header: "Type",
                    getValue: (agreement) => convertCodeForDisplay("agreementType", agreement?.agreement_type)
                },
                {
                    header: "Start Date",
                    getValue: (agreement) =>
                        agreement.sc_start_date ? formatDate(new Date(agreement.sc_start_date + "T00:00:00Z")) : "TBD"
                },
                {
                    header: "End Date",
                    getValue: (agreement) =>
                        agreement.sc_end_date ? formatDate(new Date(agreement.sc_end_date + "T00:00:00Z")) : "TBD"
                },
                { header: "Total", currency: true, getValue: (agreement) => Number(agreement.agreement_total ?? 0) },
                {
                    header: fyLabel,
                    currency: true,
                    getValue: (agreement) =>
                        isAllFY ? Number(agreement.lifetime_obligated ?? 0) : Number(agreement.fy_obligated ?? 0)
                },
                { header: "Project", getValue: (agreement) => getResearchProjectName(agreement) ?? "" },
                { header: "Procurement Shop", getValue: (agreement) => getProcurementShopDisplay(agreement) },
                {
                    header: "Subtotal",
                    currency: true,
                    getValue: (agreement) => Number(agreement.agreement_subtotal ?? 0)
                },
                {
                    header: "Fees",
                    currency: true,
                    getValue: (agreement) => Number(agreement.total_agreement_fees ?? 0)
                },
                {
                    header: "Lifetime Obligated",
                    currency: true,
                    omitWhenAllFY: true,
                    getValue: (agreement) => Number(agreement.lifetime_obligated ?? 0)
                },
                { header: "Contract Number", getValue: (agreement) => getAgreementContractNumber(agreement) ?? "" },
                { header: "Award Type", getValue: (agreement) => agreement?.award_type ?? "" },
                { header: "Vendor", getValue: (agreement) => agreement?.vendor ?? "" },
                { header: "COR", getValue: (agreement) => agreementDataMap[agreement.id]?.cor ?? "" }
            ];
            const activeColumnDefs = columnDefs.filter((column) => !(column.omitWhenAllFY && isAllFY));

            await exportTableToXlsx({
                data: allAgreementsList,
                headers: activeColumnDefs.map((column) => column.header),
                rowMapper: (agreement) => activeColumnDefs.map((column) => column.getValue(agreement)),
                filename: "agreements",
                currencyColumns: activeColumnDefs.reduce(
                    (indices, column, index) => (column.currency ? [...indices, index] : indices),
                    []
                )
            });
        } catch (error) {
            console.error("Failed to export data:", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while exporting the data.",
                redirectUrl: "/error"
            });
        } finally {
            setIsExporting(false);
        }
    };

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
        <App breadCrumbName="Agreements">
            {!changeRequestUrl && (
                <TablePageLayout
                    title="Agreements"
                    subtitle={subtitle}
                    details={details}
                    TabsSection={<AgreementTabs />}
                    FilterTags={
                        <AgreementsFilterTags
                            filters={filters}
                            setFilters={setFilters}
                        />
                    }
                    FilterButton={
                        <>
                            <div className="display-flex">
                                <div>
                                    {agreements.length > 0 && (
                                        <button
                                            type="button"
                                            style={{ fontSize: "16px" }}
                                            className="usa-button--unstyled text-primary display-flex flex-align-end cursor-pointer"
                                            data-cy="agreement-export"
                                            onClick={handleExport}
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
                                    <AgreementsFilterButton
                                        filters={filters}
                                        setFilters={setFilters}
                                        agreementFilterOptions={agreementFilterOptions}
                                        isLoadingOptions={isLoadingAgreementFilterOptions}
                                    />
                                </div>
                            </div>
                        </>
                    }
                    FYSelect={
                        <FiscalYear
                            fiscalYear={dropdownValue}
                            handleChangeFiscalYear={handleChangeFiscalYear}
                            fiscalYears={fiscalYearOptions}
                            showAllOption={true}
                        />
                    }
                    SummaryCardsSection={
                        !isTableLoading &&
                        totalCount > 0 && (
                            <AgreementSummaryCardsSection
                                fiscalYear={isMultiFY ? "Multi" : displayFY === "All" ? "All FYs" : `FY ${displayFY}`}
                                totals={totals}
                            />
                        )
                    }
                    TableSection={
                        isTableLoading ? (
                            <AgreementsTableLoading selectedFiscalYear={displayFY} />
                        ) : (
                            <>
                                <AgreementsTable
                                    agreements={agreements}
                                    sortConditions={sortCondition}
                                    sortDescending={sortDescending}
                                    setSortConditions={setSortConditions}
                                    selectedFiscalYear={displayFY}
                                />
                                {totalPages > 1 && (
                                    <div className="margin-top-3">
                                        <PaginationNav
                                            currentPage={currentPage}
                                            setCurrentPage={setCurrentPage}
                                            totalPages={totalPages}
                                        />
                                    </div>
                                )}
                            </>
                        )
                    }
                />
            )}
            {changeRequestUrl && (
                <TablePageLayout
                    title="Agreements"
                    subtitle={subtitle}
                    details={details}
                    TabsSection={<AgreementTabs />}
                >
                    <ChangeRequests />
                </TablePageLayout>
            )}
        </App>
    );
};

export default AgreementsList;
