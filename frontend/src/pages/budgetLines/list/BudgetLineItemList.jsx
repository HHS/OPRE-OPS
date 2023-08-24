import React from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import _ from "lodash";
import App from "../../../App";
import { useGetBudgetLineItemsQuery } from "../../../api/opsAPI";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import Alert from "../../../components/UI/Alert";
import TablePageLayout from "../../../components/UI/Layouts/TablePageLayout";
import AllBudgetLinesTable from "../../../components/UI/AllBudgetLinesTable";

/**
 * Page for the Budget Line Item List.
 * @returns {React.JSX.Element} - The component JSX.
 */
export const BudgetLineItemList = () => {
    const [searchParams] = useSearchParams();
    const isAlertActive = useSelector((state) => state.alert.isActive);
    const [filters, setFilters] = React.useState({});

    const { data, error, isLoading } = useGetBudgetLineItemsQuery();

    const activeUser = useSelector((state) => state.auth.activeUser);
    const myBudgetLineItemsUrl = searchParams.get("filter") === "my-budget-line-items";

    if (isLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (error) {
        return (
            <App>
                <h1>Oops, an error occurred</h1>
            </App>
        );
    }

    const sortBLIs = () => {};

    // FILTERS
    let filteredBudgetLineItems = _.cloneDeep(data);

    let sortedBLIs = [];
    if (myBudgetLineItemsUrl) {
        const myBLIs = filteredBudgetLineItems.filter(() => {
            return true;
        });
        sortedBLIs = sortBLIs(myBLIs);
    } else {
        // all-budget-line-items
        sortedBLIs = sortBLIs(filteredBudgetLineItems);
    }

    console.log("filters", filters);
    console.log("setFilters", setFilters);
    console.log("activeUser", activeUser);
    console.log("sortedBLIs", sortedBLIs);

    return (
        <App>
            <Breadcrumb currentName={"Budget Lines"} />
            {isAlertActive && <Alert />}
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
                TableSection={<AllBudgetLinesTable budgetLines={data} />}
            />
        </App>
    );
};
