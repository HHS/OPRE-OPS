import { useEffect, useState } from "react";
import PacmanLoader from "react-spinners/PacmanLoader";
import App from "../../../App";
import {
    useGetBudgetLineItemsFilterOptionsQuery,
    useGetBudgetLineItemsQuery,
    useLazyGetBudgetLineItemsQuery,
    useLazyGetServicesComponentByIdQuery
} from "../../../api/opsAPI";
import AllBudgetLinesTable from "../../../components/BudgetLineItems/AllBudgetLinesTable";
import SummaryCardsSection from "../../../components/BudgetLineItems/SummaryCardsSection";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import { formatDateNeeded, totalBudgetLineFeeAmount } from "../../../helpers/utils";
import icons from "../../../uswds/img/sprite.svg";
import BLIFilterButton from "./BLIFilterButton";
import BLIFilterTags from "./BLIFilterTags";
import BLITags from "./BLITabs";
import { useBudgetLinesList } from "./BudgetLinesItems.hooks";

/**
 * @component Page for the Budget Line Item List.
 * @returns {JSX.Element} - The component JSX.
 */
const BudgetLineItemList = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { myBudgetLineItemsUrl, filters, setFilters } = useBudgetLinesList();
    /** @type {{data?: import("../../../components/BudgetLineItems/BudgetLineTypes").Filters | undefined, isSuccess: boolean}} */
    const { data: filterOptions, isSuccess: isFilterOptionSuccess } = useGetBudgetLineItemsFilterOptionsQuery(
        { onlyMy: myBudgetLineItemsUrl },
        { refetchOnMountOrArgChange: true }
    );
    /** @type {{data?: import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine[] | undefined, isLoading: boolean}} */
    const {
        data: budgetLineItems,
        error: budgetLineItemsError,
        isLoading: budgetLineItemsIsLoading
    } = useGetBudgetLineItemsQuery({
        filters,
        page: currentPage - 1,
        onlyMy: myBudgetLineItemsUrl,
        includeFees: true,
        refetchOnMountOrArgChange: true
    });

    const [serviceComponentTrigger] = useLazyGetServicesComponentByIdQuery();
    const [budgetLineTrigger] = useLazyGetBudgetLineItemsQuery();

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

    const budgetLinesFiscalYears = isFilterOptionSuccess ? filterOptions?.fiscal_years : [];
    const handleExport = async () => {
        try {
            if (!budgetLineItems) {
                return;
            }

            setIsExporting(true);
            const totalCount = budgetLineItems[0]._meta.total_count ?? 0;
            const fetchLimit = 50;
            const totalPages = Math.ceil(totalCount / fetchLimit);

            const budgetLinePromises = Array.from({ length: totalPages }, (_, page) =>
                budgetLineTrigger({
                    filters,
                    limit: fetchLimit,
                    page
                })
            );

            const budgetLineResponses = await Promise.all(budgetLinePromises);
            const flattenedBudgetLineResponses = budgetLineResponses.flatMap((page) => page.data);

            // Get the service component name for each budget line individually
            const serviceComponentPromises = flattenedBudgetLineResponses
                .filter((budgetLine) => budgetLine?.services_component_id)
                .map((budgetLine) => serviceComponentTrigger(budgetLine.services_component_id).unwrap());

            const serviceComponentResponses = await Promise.all(serviceComponentPromises);

            /** @type {Record<number, {service_component_name: string}>} */
            const budgetLinesDataMap = {};
            flattenedBudgetLineResponses.forEach((budgetLine) => {
                const response = serviceComponentResponses.find(
                    (resp) => resp && resp.id === budgetLine?.services_component_id
                );

                budgetLinesDataMap[budgetLine.id] = {
                    service_component_name: response?.display_name || "TBD" // Use optional chaining and fallback
                };
            });

            const header = [
                "BL ID #",
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
                    /** @param {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} budgetLine */
                    (budgetLine) => {
                        const fees = totalBudgetLineFeeAmount(
                            budgetLine?.amount ?? 0,
                            budgetLine?.proc_shop_fee_percentage
                        );
                        const feeRate =
                            !budgetLine?.proc_shop_fee_percentage || budgetLine?.proc_shop_fee_percentage === 0
                                ? "0"
                                : `${(budgetLine?.proc_shop_fee_percentage * 100).toFixed(2)}%`;
                        return [
                            budgetLine.id,
                            budgetLine.agreement?.name || "TBD",
                            budgetLinesDataMap[budgetLine.id]?.service_component_name,
                            budgetLine.line_description,
                            formatDateNeeded(budgetLine?.date_needed ?? ""),
                            budgetLine.fiscal_year,
                            budgetLine.can?.display_name || "TBD",
                            budgetLine?.amount?.toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD"
                            }) ?? "",
                            fees.toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD"
                            }) ?? "",
                            feeRate,
                            budgetLine?.in_review ? "In Review" : budgetLine?.status,
                            budgetLine.comments
                        ];
                    },
                filename: "budget_lines"
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
                                        className="usa-button--unstyled text-primary display-flex flex-align-end"
                                        data-cy="budget-line-export"
                                        onClick={handleExport}
                                    >
                                        <svg
                                            className={`height-2 width-2 margin-right-05`}
                                            style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                                        >
                                            <use xlinkHref={`${icons}#save_alt`}></use>
                                        </svg>
                                        <span>Export</span>
                                    </button>
                                )}
                            </div>
                            <div className="margin-left-205">
                                <BLIFilterButton
                                    filters={filters}
                                    setFilters={setFilters}
                                    filterOptions={filterOptions ?? {}}
                                    budgetLinesFiscalYears={budgetLinesFiscalYears ?? []}
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
