import {useEffect, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import PacmanLoader from "react-spinners/PacmanLoader";
import App from "../../../App";
import AgreementsTable from "../../../components/Agreements/AgreementsTable";
import {
    findNextBudgetLine,
    findNextNeedBy,
    getAgreementName,
    getAgreementSubTotal,
    getResearchProjectName
} from "../../../components/Agreements/AgreementsTable/AgreementsTable.helpers";
import ChangeRequests from "../../../components/ChangeRequests";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import {setAlert} from "../../../components/UI/Alert/alertSlice";
import PaginationNav from "../../../components/UI/PaginationNav/PaginationNav";
import {useSetSortConditions} from "../../../components/UI/Table/Table.hooks";
import {getAgreementFeesFromBackend} from "../../../helpers/agreement.helpers";
import {exportTableToXlsx} from "../../../helpers/tableExport.helpers";
import {convertCodeForDisplay} from "../../../helpers/utils";
import icons from "../../../uswds/img/sprite.svg";
import AgreementsFilterButton from "./AgreementsFilterButton/AgreementsFilterButton";
import AgreementsFilterTags from "./AgreementsFilterTags/AgreementsFilterTags";
import AgreementTabs from "./AgreementsTabs";
import {
    useGetAgreementsQuery,
    useLazyGetAgreementByIdQuery,
    useLazyGetAgreementsQuery,
    useLazyGetUserQuery
} from "../../../api/opsAPI.js";

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
        budgetLineStatus: []
    });
    const { sortDescending, sortCondition, setSortConditions} = useSetSortConditions();
    const [currentPage, setCurrentPage] = useState(1); // 1-indexed for UI
    const [pageSize] = useState(10);

    const myAgreementsUrl = searchParams.get("filter") === "my-agreements";
    const changeRequestUrl = searchParams.get("filter") === "change-requests";

    const queryParams = {
        filters,
        onlyMy: myAgreementsUrl,
        sortConditions: sortCondition,
        sortDescending: sortDescending,
        page: currentPage - 1, // Convert to 0-indexed for API
        limit: pageSize,
        refetchOnMountOrArgChange: true
    };

    const {
        data: agreementsResponse,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementsQuery(queryParams);

    // Extract agreements array and metadata from wrapped response
    const agreements = agreementsResponse?.agreements || [];
    const totalCount = agreementsResponse?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Reset to page 1 when filters or sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, myAgreementsUrl, sortCondition, sortDescending]);

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

            // Fetch ALL agreements for export (not just current page)
            const allAgreementsResponse = await getAllAgreementsTrigger({
                filters,
                onlyMy: myAgreementsUrl,
                sortConditions: sortCondition,
                sortDescending: sortDescending,
                page: 0,
                limit: totalCount || 9999 // Request all items
            }).unwrap();

            const allAgreementsList = allAgreementsResponse?.agreements || [];

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

            const tableHeader = [
                "Agreement",
                "Project",
                "Agreement Type",
                "Contract Type",
                "Agreement SubTotal",
                "Agreement Fees",
                "Next Budget Line SubTotal",
                "Next Budget Line Fees",
                "Next Obligate By",
                "Vendor",
                "COR"
            ];
            await exportTableToXlsx({
                data: agreementResponses,
                headers: tableHeader,
                rowMapper: (agreement) => {
                    const agreementName = getAgreementName(agreement);
                    const project = getResearchProjectName(agreement);
                    const agreementType = convertCodeForDisplay("agreementType", agreement?.agreement_type);
                    const contractType = convertCodeForDisplay("contractType", agreement?.contract_type);
                    const agreementSubTotal = getAgreementSubTotal(agreement);
                    const agreementFees = getAgreementFeesFromBackend(agreement);
                    const nextBudgetLine = findNextBudgetLine(agreement);
                    const nextBudgetLineAmount = nextBudgetLine?.amount ?? 0;
                    let nextBudgetLineFees = nextBudgetLine?.fees;
                    if (isNaN(nextBudgetLineFees)) {
                        nextBudgetLineFees = 0;
                    }
                    const nextObligateBy = findNextNeedBy(agreement);

                    return [
                        agreementName,
                        project,
                        agreementType,
                        contractType,
                        agreementSubTotal ?? 0,
                        agreementFees ?? 0,
                        nextBudgetLineAmount ?? 0,
                        nextBudgetLineFees ?? 0,
                        nextObligateBy ?? "",
                        agreement?.vendor ?? "",
                        agreementDataMap[agreement.id]?.cor ?? ""
                    ];
                },
                filename: "agreements",
                currencyColumns: [4, 5, 6, 7] // Agreement SubTotal, Agreement Fees, Next Budget Line SubTotal, Next Budget Line Fees
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
                                    />
                                </div>
                            </div>
                        </>
                    }
                    TableSection={
                        <>
                            <AgreementsTable
                                agreements={agreements}
                                sortConditions={sortCondition}
                                sortDescending={sortDescending}
                                setSortConditions={setSortConditions}
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
