import App from "../../../App";
import { useGetAgreementsQuery, useGetBudgetLineItemsQuery, useGetCansQuery } from "../../../api/opsAPI";
import AllBudgetLinesTable from "../../../components/BudgetLineItems/AllBudgetLinesTable";
import SummaryCardsSection from "../../../components/BudgetLineItems/SummaryCardsSection";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
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
 * @returns {JSX.Element} - The component JSX.
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
                buttonText="Add Budget Lines"
                buttonLink="/budget-lines/create"
                TabsSection={<BLITags />}
                FilterTags={
                    <BLIFilterTags
                        filters={filters}
                        setFilters={setFilters}
                    />
                }
                TableSection={<AllBudgetLinesTable budgetLines={budgetLinesWithCanAndAgreementName} />}
                FilterButton={
                    <BLIFilterButton
                        filters={filters}
                        setFilters={setFilters}
                        budgetLinesFiscalYears={budgetLinesFiscalYears}
                    />
                }
                SummaryCardsSection={<SummaryCardsSection budgetLines={budgetLinesWithCanAndAgreementName} />}
            />
        </App>
    );
};

export default BudgetLineItemList;
