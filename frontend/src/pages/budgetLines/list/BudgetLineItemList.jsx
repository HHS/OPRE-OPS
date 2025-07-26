import { useEffect, useState } from "react";
import PacmanLoader from "react-spinners/PacmanLoader";
import App from "../../../App";
import {
    useGetBudgetLineItemsQuery,
    useLazyGetBudgetLineItemsQuery,
    useLazyGetProcurementShopsQuery,
    useLazyGetServicesComponentByIdQuery
} from "../../../api/opsAPI";
import AllBudgetLinesTable from "../../../components/BudgetLineItems/AllBudgetLinesTable";
import SummaryCardsSection from "../../../components/BudgetLineItems/SummaryCardsSection";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import { calculateProcShopFeePercentage } from "../../../helpers/budgetLines.helpers";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import { formatDateNeeded, totalBudgetLineFeeAmount } from "../../../helpers/utils";
import icons from "../../../uswds/img/sprite.svg";
import BLIFilterButton from "./BLIFilterButton";
import BLIFilterTags from "./BLIFilterTags";
import BLITags from "./BLITabs";
import { useBudgetLinesList } from "./BudgetLinesItems.hooks";

/**
 * @component Page for the Budget Line Item List.
 * @returns {React.ReactElement} - The component JSX.
 */
const BudgetLineItemList = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();
    const { myBudgetLineItemsUrl, filters, setFilters } = useBudgetLinesList();

    /** @type {{data?: import("../../../types/BudgetLineTypes").BudgetLine[] | undefined, isError: boolean, isLoading: boolean}} */
    const {
        data: budgetLineItems,
        isError: budgetLineItemsError,
        isLoading: budgetLineItemsIsLoading
    } = useGetBudgetLineItemsQuery({
        filters,
        page: currentPage - 1,
        onlyMy: myBudgetLineItemsUrl,
        includeFees: true,
        sortConditions: sortCondition,
        sortDescending: sortDescending,
        refetchOnMountOrArgChange: true
    });

    const [serviceComponentTrigger] = useLazyGetServicesComponentByIdQuery();
    const [budgetLineTrigger] = useLazyGetBudgetLineItemsQuery();
    const [procShopTrigger] = useLazyGetProcurementShopsQuery();

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

    // TODO: Move this to the BudgetLineItems.helpers.js file
    const handleExport = async () => {
        try {
            if (!budgetLineItems || budgetLineItems.length === 0) {
                return;
            }

            setIsExporting(true);
            const totalCount = budgetLineItems[0]._meta?.total_count ?? 0;
            const fetchLimit = 50;
            const totalPages = Math.ceil(totalCount / fetchLimit);

            const budgetLinePromises = Array.from({ length: totalPages }, (_, page) =>
                budgetLineTrigger({
                    filters,
                    limit: fetchLimit,
                    page
                })
            );
            let procShopResponses = [];
            try {
                procShopResponses = await procShopTrigger({}).unwrap();
            } catch (procShopError) {
                console.error("Failed to fetch procurement shops, using fallback values", procShopError);
            }
            const budgetLineResponses = await Promise.all(budgetLinePromises);
            const flattenedBudgetLineResponses = budgetLineResponses.flatMap((page) => page.data);

            // Get the service component name for each budget line individually
            const serviceComponentPromises = flattenedBudgetLineResponses
                .filter((budgetLine) => budgetLine?.services_component_id)
                .map((budgetLine) => serviceComponentTrigger(budgetLine.services_component_id).unwrap());

            const serviceComponentResponses = await Promise.all(serviceComponentPromises);

            /** @type {Record<number, {service_component_name: string}>} */
            const budgetLinesDataMap = {};
            /** @type {Record<number, import("../../../types/AgreementTypes").ProcurementShop >} */
            const procShopMap = {};
            flattenedBudgetLineResponses.forEach((budgetLine) => {
                const agreementAwardingEntityId = budgetLine.agreement?.awarding_entity_id;
                if (agreementAwardingEntityId) {
                    const procShop = procShopResponses.find((shop) => shop.id === agreementAwardingEntityId);
                    if (procShop) {
                        procShopMap[budgetLine.id] = procShop.fee_percentage;
                    }
                }
                const response = serviceComponentResponses.find(
                    (resp) => resp && resp.id === budgetLine?.services_component_id
                );

                budgetLinesDataMap[budgetLine.id] = {
                    service_component_name: response?.display_name || "TBD" // Use optional chaining and fallback
                };
            });

            const header = [
                "BL ID #",
                "Project",
                "Agreement",
                "SC",
                "Description",
                "Obligate By",
                "FY",
                "CAN",
                "SubTotal",
                "Procurement shop fee",
                "Procurement shop fee rate",
                "Status",
                "Comments"
            ];

            await exportTableToXlsx({
                data: flattenedBudgetLineResponses,
                headers: header,
                rowMapper:
                    /** @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLine */
                    (budgetLine) => {
                        const feeRate = calculateProcShopFeePercentage(budgetLine, procShopMap[budgetLine.id] || 0);
                        const fees = totalBudgetLineFeeAmount(budgetLine?.amount ?? 0, feeRate / 100);
                        return [
                            budgetLine.id,
                            budgetLine.agreement?.project || "TBD",
                            budgetLine.agreement?.name || "TBD",
                            budgetLinesDataMap[budgetLine.id]?.service_component_name,
                            budgetLine.line_description,
                            formatDateNeeded(budgetLine?.date_needed ?? ""),
                            budgetLine.fiscal_year,
                            budgetLine.can?.display_name || "TBD",
                            budgetLine?.amount ?? 0,
                            fees ?? 0,
                            feeRate,
                            budgetLine?.in_review ? "In Review" : budgetLine?.status,
                            budgetLine.comments
                        ];
                    },
                filename: "budget_lines",
                currencyColumns: [7, 8]
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
        <App breadCrumbName="Budget Lines">
            <TablePageLayout
                title="Budget Lines"
                subtitle={myBudgetLineItemsUrl ? "My Budget Lines" : "All Budget Lines"}
                details={
                    myBudgetLineItemsUrl
                        ? "This is a list of the budget lines you are listed as a Team Member on. Please select filter options to see budget lines by Portfolio, Status, or Fiscal Year."
                        : "This is a list of budget lines across all OPRE projects and agreements, including drafts. Please select filter options to see budget lines by Portfolio, Status, or Fiscal Year."
                }
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
                                <BLIFilterButton
                                    filters={filters}
                                    setFilters={setFilters}
                                />
                            </div>
                        </div>
                    </>
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
                        />
                    )
                }
            />
        </App>
    );
};

export default BudgetLineItemList;
