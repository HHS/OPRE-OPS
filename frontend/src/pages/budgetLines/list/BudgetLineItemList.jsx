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
import { totalBudgetLineFeeAmount, formatDateNeeded } from "../../../helpers/utils";
import BLIFilterButton from "./BLIFilterButton";
import BLIFilterTags from "./BLIFilterTags";
import BLITags from "./BLITabs";
import {
    addCanAndAgreementNameToBudgetLines,
    filterBudgetLineItems,
    handleFilterByUrl,
    uniqueBudgetLinesFiscalYears
} from "./BudgetLineItems.helpers";
import { useBudgetLinesList } from "./BudgetLinesItems.hooks";

/**
 * @component Page for the Budget Line Item List.
 * @returns {import("react").JSX.Element} - The component JSX.
 */
const BudgetLineItemList = () => {
    const {
        data: budgetLineItems,
        error: budgetLineItemsError,
        isLoading: budgetLineItemsIsLoading
    } = useGetBudgetLineItemsQuery({});
    const { data: cans, error: cansError, isLoading: cansIsLoading } = useGetCansQuery({});
    const { data: agreements, error: agreementsError, isLoading: agreementsAreError } = useGetAgreementsQuery({});
    const { myBudgetLineItemsUrl, activeUser, filters, setFilters } = useBudgetLinesList();

    const [trigger] = useLazyGetServicesComponentByIdQuery();

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

    const filteredBudgetLineItems = filterBudgetLineItems(budgetLineItems, filters);
    const sortedBLIs = handleFilterByUrl(myBudgetLineItemsUrl, filteredBudgetLineItems, agreements, activeUser);
    const budgetLinesWithCanAndAgreementName = addCanAndAgreementNameToBudgetLines(sortedBLIs, cans, agreements);
    const budgetLinesFiscalYears = uniqueBudgetLinesFiscalYears(budgetLineItems);

    const handleExport = async () => {
        try {
            // Get the service component name for each budget line individually
            const serviceComponentPromises = budgetLinesWithCanAndAgreementName
                .filter((budgetLine) => budgetLine?.services_component_id)
                .map((budgetLine) => trigger(budgetLine.services_component_id).unwrap());

            const serviceComponentResponses = await Promise.all(serviceComponentPromises);

            /** @type {Record<number, {service_component_name: string, fees: number}>} */
            const budgetLinesDataMap = {};
            budgetLinesWithCanAndAgreementName.forEach((budgetLine) => {
                const fees = totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine?.proc_shop_fee_percentage);
                const response = serviceComponentResponses.find(
                    (resp) => resp && resp.id === budgetLine?.services_component_id
                );

                budgetLinesDataMap[budgetLine.id] = {
                    service_component_name: response?.display_name || "TBD", // Use optional chaining and fallback
                    fees
                };
            });

            const currentTimeStamp = new Date().toISOString();
            const header = ["BL ID #", "Agreement", "SC", "Obligate By", "FY", "CAN", "SubTotal", "Fees", "Status"];

            await exportTableToXlsx({
                data: budgetLinesWithCanAndAgreementName,
                headers: header,
                rowMapper: (/** @type {import("../../../helpers/budgetLines.helpers").BudgetLine} */ budgetLine) => [
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
                    budgetLinesDataMap[budgetLine.id]?.fees.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD"
                    }) ?? "",
                    budgetLine?.in_review ? "In Review" : budgetLine?.status
                ],
                filename: `budget_lines_${currentTimeStamp}.xlsx`
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
                TableSection={<AllBudgetLinesTable budgetLines={budgetLinesWithCanAndAgreementName} />}
                FilterButton={
                    <>
                        <div className="display-flex">
                            <div>
                                <BLIFilterButton
                                    filters={filters}
                                    setFilters={setFilters}
                                    budgetLinesFiscalYears={budgetLinesFiscalYears}
                                />
                            </div>

                            <div className="text-right">
                                {budgetLinesWithCanAndAgreementName.length > 0 && (
                                    <button
                                        className="usa-button usa-button--outline text-primary margin-left-1"
                                        data-cy="budget-line-export"
                                        onClick={handleExport}
                                    >
                                        Export
                                    </button>
                                )}
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
