import App from "../../../App";
import {
    useGetAgreementsQuery,
    useGetBudgetLineItemsQuery,
    useGetCansQuery,
    useLazyGetServicesComponentByIdQuery
} from "../../../api/opsAPI";
import AllBudgetLinesTable from "../../../components/BudgetLineItems/AllBudgetLinesTable";
import SummaryCardsSection from "../../../components/BudgetLineItems/SummaryCardsSection";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import { formatDateNeeded, totalBudgetLineFeeAmount } from "../../../helpers/utils";
import BLIFilterButton from "./BLIFilterButton";
import BLIFilterTags from "./BLIFilterTags";
import BLITags from "./BLITabs";
import {
    addCanAndAgreementNameToBudgetLines,
    handleFilterByUrl,
    uniqueBudgetLinesFiscalYears
} from "./BudgetLineItems.helpers";
import { useBudgetLinesList } from "./BudgetLinesItems.hooks";
import icons from "../../../uswds/img/sprite.svg";
import _ from "lodash";
import { useEffect, useState } from "react";

/**
 * @component Page for the Budget Line Item List.
 * @returns {import("react").JSX.Element} - The component JSX.
 */
const BudgetLineItemList = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const { myBudgetLineItemsUrl, activeUser, filters, setFilters } = useBudgetLinesList();
    const {
        data: budgetLineItems,
        error: budgetLineItemsError,
        isLoading: budgetLineItemsIsLoading
    } = useGetBudgetLineItemsQuery({ filters, page: currentPage - 1, refetchOnMountOrArgChange: true });
    const { data: cans, error: cansError, isLoading: cansIsLoading } = useGetCansQuery({});
    const {
        data: agreements,
        error: agreementsError,
        isLoading: agreementsAreError
    } = useGetAgreementsQuery({ filters });

    const [trigger] = useLazyGetServicesComponentByIdQuery();

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    if (budgetLineItemsIsLoading || cansIsLoading || agreementsAreError) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (budgetLineItemsError || cansError || agreementsError) {
        return (
            <App>
                <h1>Oops, an error occurred</h1>
            </App>
        );
    }

    // const filteredBudgetLineItems = filterBudgetLineItems(budgetLineItems, filters);
    let copyOfBLIs = _.cloneDeep(budgetLineItems);
    const sortedBLIs = handleFilterByUrl(myBudgetLineItemsUrl, copyOfBLIs, agreements, activeUser);

    // adding agreement name and can number to budget lines
    const budgetLinesWithCanAndAgreementName = addCanAndAgreementNameToBudgetLines(sortedBLIs, cans, agreements);
    const budgetLinesFiscalYears = uniqueBudgetLinesFiscalYears(budgetLineItems);

    const handleExport = async () => {
        try {
            // Get the service component name for each budget line individually
            const serviceComponentPromises = budgetLinesWithCanAndAgreementName
                .filter((budgetLine) => budgetLine?.services_component_id)
                .map((budgetLine) => trigger(budgetLine.services_component_id).unwrap());

            const serviceComponentResponses = await Promise.all(serviceComponentPromises);

            /** @type {Record<number, {service_component_name: string}>} */
            const budgetLinesDataMap = {};
            budgetLinesWithCanAndAgreementName.forEach((budgetLine) => {
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
                "Obligate By",
                "FY",
                "CAN",
                "SubTotal",
                "Procurement shop fee",
                "Procurement shop fee rate",
                "Status"
            ];

            await exportTableToXlsx({
                data: budgetLinesWithCanAndAgreementName,
                headers: header,
                rowMapper: (/** @type {import("../../../helpers/budgetLines.helpers").BudgetLine} */ budgetLine) => {
                    const fees = totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine?.proc_shop_fee_percentage);
                    const feeRate =
                        !budgetLine?.proc_shop_fee_percentage || budgetLine?.proc_shop_fee_percentage === 0
                            ? "0"
                            : `${budgetLine?.proc_shop_fee_percentage * 100}%`;
                    return [
                        budgetLine.id,
                        budgetLine.agreement_name,
                        budgetLinesDataMap[budgetLine.id]?.service_component_name,
                        formatDateNeeded(budgetLine?.date_needed),
                        budgetLine.fiscal_year,
                        budgetLine.can_number,
                        budgetLine?.amount?.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD"
                        }) ?? "",
                        fees.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD"
                        }) ?? "",
                        feeRate,
                        budgetLine?.in_review ? "In Review" : budgetLine?.status
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
        }
    };

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
                    <AllBudgetLinesTable
                        cans={cans}
                        agreements={agreements}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        budgetLineItems={budgetLineItems}
                        budgetLineItemsError={budgetLineItemsError}
                        budgetLineItemsIsLoading={budgetLineItemsIsLoading}
                    />
                }
                FilterButton={
                    <>
                        <div className="display-flex">
                            <div>
                                {budgetLinesWithCanAndAgreementName.length > 0 && (
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
                                    budgetLinesFiscalYears={budgetLinesFiscalYears}
                                />
                            </div>
                        </div>
                    </>
                }
                SummaryCardsSection={<SummaryCardsSection budgetLines={budgetLinesWithCanAndAgreementName} />}
            />
        </App>
    );
};

export default BudgetLineItemList;
