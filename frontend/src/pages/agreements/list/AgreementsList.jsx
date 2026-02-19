import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PacmanLoader from "react-spinners/PacmanLoader";
import {
    useGetAgreementsFilterOptionsQuery,
    useGetAgreementsQuery,
    useLazyGetAgreementByIdQuery,
    useLazyGetAgreementsQuery,
    useLazyGetUserQuery
} from "../../../api/opsAPI.js";
import App from "../../../App";
import AgreementsTable from "../../../components/Agreements/AgreementsTable";
import {
    getAgreementContractNumber,
    getAgreementName,
    getAgreementSubTotal,
    getFYObligatedAmount,
    getLifetimeObligatedAmount,
    getProcurementShopDisplay,
    getResearchProjectName
} from "../../../components/Agreements/AgreementsTable/AgreementsTable.helpers";
import ChangeRequests from "../../../components/ChangeRequests";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import FiscalYear from "../../../components/UI/FiscalYear";
import PaginationNav from "../../../components/UI/PaginationNav/PaginationNav";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import { ITEMS_PER_PAGE } from "../../../constants";
import { getAgreementFeesFromBackend } from "../../../helpers/agreement.helpers";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import { convertCodeForDisplay, formatDate, getCurrentFiscalYear } from "../../../helpers/utils";
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
    const [isExporting, setIsExporting] = useState(false);
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        portfolio: [],
        fiscalYear: [],
        projectTitle: [],
        agreementType: [],
        agreementName: [],
        contractNumber: []
    });
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();
    const [currentPage, setCurrentPage] = useState(1); // 1-indexed for UI
    const [pageSize] = useState(ITEMS_PER_PAGE);
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear());

    const myAgreementsUrl = searchParams.get("filter") === "my-agreements";
    const changeRequestUrl = searchParams.get("filter") === "change-requests";

    const { data: agreementFilterOptions } = useGetAgreementsFilterOptionsQuery({ onlyMy: myAgreementsUrl });

    // Determine fiscal year filter based on selection
    const hasOtherFilters =
        filters.portfolio.length > 0 ||
        filters.projectTitle.length > 0 ||
        filters.agreementType.length > 0 ||
        filters.agreementName.length > 0 ||
        filters.contractNumber.length > 0;

    const getFiscalYearFilter = () => {
        // If explicit filters are set via filter modal, use those
        if ((filters.fiscalYear ?? []).length > 0) {
            // "All FYs" means no fiscal year filter
            if (filters.fiscalYear.some((fy) => fy.id === "all")) {
                return [];
            }
            return filters.fiscalYear;
        }
        // If other filters are active but no fiscal year was selected, don't default
        if (hasOtherFilters) {
            return [];
        }
        // If "All" is selected from the page dropdown, no fiscal year filter
        if (selectedFiscalYear === "All") {
            return [];
        }
        // Otherwise, use the selected fiscal year
        return [{ id: Number(selectedFiscalYear), title: Number(selectedFiscalYear) }];
    };

    const queryParams = {
        filters: {
            ...filters,
            fiscalYear: getFiscalYearFilter()
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
        isLoading: isLoadingAgreement
    } = useGetAgreementsQuery(queryParams, {
        refetchOnMountOrArgChange: true
    });

    // Extract agreements array and metadata from wrapped response
    const agreements = agreementsResponse?.agreements || [];
    const totalCount = agreementsResponse?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Reset to page 1 when filters or sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, myAgreementsUrl, sortCondition, sortDescending]);

    // Sync fiscal year filter modal with page-level dropdown
    // When "All FYs" is selected in the filter modal, change page dropdown to "All"
    useEffect(() => {
        if (filters.fiscalYear && filters.fiscalYear.length > 0) {
            const hasAllFYs = filters.fiscalYear.some((fy) => fy.id === "all");

            if (hasAllFYs && selectedFiscalYear !== "All") {
                setSelectedFiscalYear("All");
            }
        }
    }, [filters.fiscalYear, selectedFiscalYear]);

    // Handle fiscal year change - clear filters when changing fiscal year selection
    const handleChangeFiscalYear = (newValue) => {
        setFilters({
            portfolio: [],
            fiscalYear: [],
            projectTitle: [],
            agreementType: [],
            agreementName: [],
            contractNumber: []
        });
        setSelectedFiscalYear(newValue);
    };

    const [trigger] = useLazyGetUserQuery();
    const [agreementTrigger] = useLazyGetAgreementByIdQuery();
    const [getAllAgreementsTrigger] = useLazyGetAgreementsQuery();

    if (isLoadingAgreement) {
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
    let details = "This is a list of all agreements across OPRE. Draft budget lines are not included in the Totals.";
    if (myAgreementsUrl) {
        subtitle = "My Agreements";
        details =
            "This is a list of agreements you are listed as a Team Member on.  Draft budget lines are not included in the Totals.";
    }
    if (changeRequestUrl) {
        subtitle = "For Review";
        details =
            "This is a list of changes within your Division that require your review and approval. This list could include requests for budget changes, status changes or actions taking place during the procurement process.";
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
                            fiscalYear: getFiscalYearFilter()
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

            const allAgreements = allAgreementsList.map((agreement) => {
                return agreementTrigger(agreement.id).unwrap();
            });

            const agreementResponses = await Promise.all(allAgreements);

            const corPromises = allAgreementsList
                .filter((agreement) => agreement?.project_officer_id)
                .map((agreement) => trigger(agreement.project_officer_id).unwrap());

            const corResponses = await Promise.all(corPromises);

            /** @type {Record<number, {cor: string}>} */
            const agreementDataMap = {};
            allAgreementsList.forEach((agreement) => {
                const corData = corResponses.find((cor) => cor.id === agreement.project_officer_id);

                agreementDataMap[agreement.id] = {
                    cor: corData?.full_name ?? "TBD"
                };
            });

            const effectiveFY =
                selectedFiscalYear === "All" ? Number(getCurrentFiscalYear()) : Number(selectedFiscalYear);
            const fyLabel = `FY${String(effectiveFY).slice(-2)} Obligated`;

            const tableHeader = [
                "Agreement",
                "Type",
                "Start Date",
                "End Date",
                "Total",
                fyLabel,
                "Project",
                "Procurement Shop",
                "Subtotal",
                "Fees",
                "Lifetime Obligated",
                "Contract Number",
                "Vendor",
                "COR"
            ];
            await exportTableToXlsx({
                data: agreementResponses,
                headers: tableHeader,
                rowMapper: (agreement) => {
                    const agreementName = getAgreementName(agreement);
                    const agreementType = convertCodeForDisplay("agreementType", agreement?.agreement_type);
                    const startDate = agreement.start_date ? formatDate(new Date(agreement.start_date)) : "TBD";
                    const endDate = agreement.end_date ? formatDate(new Date(agreement.end_date)) : "TBD";
                    const agreementSubTotal = getAgreementSubTotal(agreement);
                    const agreementFees = getAgreementFeesFromBackend(agreement);
                    const total = (agreementSubTotal ?? 0) + (agreementFees ?? 0);
                    const fyObligated = getFYObligatedAmount(agreement, effectiveFY);
                    const project = getResearchProjectName(agreement);
                    const procurementShop = getProcurementShopDisplay(agreement);
                    const lifetimeObligated = getLifetimeObligatedAmount(agreement);
                    const contractNumber = getAgreementContractNumber(agreement);

                    return [
                        agreementName,
                        agreementType,
                        startDate,
                        endDate,
                        total,
                        fyObligated,
                        project ?? "",
                        procurementShop,
                        agreementSubTotal ?? 0,
                        agreementFees ?? 0,
                        lifetimeObligated,
                        contractNumber ?? "",
                        agreement?.vendor ?? "",
                        agreementDataMap[agreement.id]?.cor ?? ""
                    ];
                },
                filename: "agreements",
                currencyColumns: [4, 5, 8, 9, 10] // Total, FY Obligated, Subtotal, Fees, Lifetime Obligated
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
                    buttonText="Add Agreement"
                    buttonLink="/agreements/create"
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
                                    />
                                </div>
                            </div>
                        </>
                    }
                    FYSelect={
                        <FiscalYear
                            fiscalYear={selectedFiscalYear}
                            handleChangeFiscalYear={handleChangeFiscalYear}
                            showAllOption={true}
                        />
                    }
                    TableSection={
                        <>
                            <AgreementsTable
                                agreements={agreements}
                                sortConditions={sortCondition}
                                sortDescending={sortDescending}
                                setSortConditions={setSortConditions}
                                selectedFiscalYear={selectedFiscalYear}
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
                    }
                />
            )}
            {changeRequestUrl && (
                <TablePageLayout
                    title="Agreements"
                    subtitle={subtitle}
                    details={details}
                    buttonText="Add Agreement"
                    buttonLink="/agreements/create"
                    TabsSection={<AgreementTabs />}
                >
                    <ChangeRequests />
                </TablePageLayout>
            )}
        </App>
    );
};

export default AgreementsList;
