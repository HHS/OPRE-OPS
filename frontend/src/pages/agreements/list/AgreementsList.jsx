import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PacmanLoader from "react-spinners/PacmanLoader";
import App from "../../../App";
import { useGetAgreementsQuery, useLazyGetAgreementByIdQuery, useLazyGetUserQuery } from "../../../api/opsAPI";
import AgreementsTable from "../../../components/Agreements/AgreementsTable";
import {
    findNextBudgetLine,
    findNextNeedBy,
    getAgreementName,
    getAgreementSubTotal,
    getProcurementShopSubTotal,
    getResearchProjectName
} from "../../../components/Agreements/AgreementsTable/AgreementsTable.helpers";
import ChangeRequests from "../../../components/ChangeRequests";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import { convertCodeForDisplay, totalBudgetLineFeeAmount } from "../../../helpers/utils";
import icons from "../../../uswds/img/sprite.svg";
import ErrorPage from "../../ErrorPage";
import AgreementsFilterButton from "./AgreementsFilterButton/AgreementsFilterButton";
import AgreementsFilterTags from "./AgreementsFilterTags/AgreementsFilterTags";
import AgreementTabs from "./AgreementsTabs";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";

/**
 * @typedef {import('../../../types/AgreementTypes').Agreement} Agreement
 */
/**
 * @component Page for the Agreements List.
 * @returns {React.ReactElement} - The component JSX.
 */
const AgreementsList = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        portfolio: [],
        fiscalYear: [],
        budgetLineStatus: []
    });
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();

    const myAgreementsUrl = searchParams.get("filter") === "my-agreements";
    const changeRequestUrl = searchParams.get("filter") === "change-requests";

    const {
        data: agreements,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementsQuery({
        filters,
        onlyMy: myAgreementsUrl,
        sortConditions: sortCondition,
        sortDescending: sortDescending,
        refetchOnMountOrArgChange: true
    });

    const [trigger] = useLazyGetUserQuery();
    const [agreementTrigger] = useLazyGetAgreementByIdQuery();

    if (isLoadingAgreement) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (errorAgreement) {
        return <ErrorPage />;
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
            const allAgreements = agreements.map((agreement) => {
                return agreementTrigger(agreement.id).unwrap();
            });

            const agreementResponses = await Promise.all(allAgreements);

            const corPromises = agreements
                .filter((agreement) => agreement?.project_officer_id)
                .map((agreement) => trigger(agreement.project_officer_id).unwrap());

            const corResponses = await Promise.all(corPromises);

            /** @type {Record<number, {cor: string}>} */
            const agreementDataMap = {};
            agreements.forEach((agreement) => {
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
                    const agreementFees = getProcurementShopSubTotal(agreement);
                    const nextBudgetLine = findNextBudgetLine(agreement);
                    const nextBudgetLineAmount = nextBudgetLine?.amount ?? 0;
                    let nextBudgetLineFees = totalBudgetLineFeeAmount(
                        nextBudgetLine?.amount,
                        nextBudgetLine?.proc_shop_fee_percentage
                    );
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
                        <AgreementsTable
                            agreements={agreements}
                            sortConditions={sortCondition}
                            sortDescending={sortDescending}
                            setSortConditions={setSortConditions}
                        />
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
