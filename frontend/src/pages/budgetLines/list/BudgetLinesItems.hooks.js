import React from "react";
import { useSearchParams } from "react-router-dom";
import { getCurrentFiscalYear } from "../../../helpers/utils";

export const useBudgetLinesList = () => {
    // Initialize with current fiscal year as default
    const currentFY = getCurrentFiscalYear();
    const [filters, setFilters] = React.useState({
        fiscalYears: [{ id: currentFY, title: currentFY }],
        portfolios: [],
        bliStatus: [],
        budgetRange: null,
        agreementTypes: [],
        agreementTitles: [],
        canActivePeriods: []
    });
    const [searchParams] = useSearchParams();

    return {
        myBudgetLineItemsUrl: searchParams.get("filter") === "my-budget-lines",
        filters,
        setFilters
    };
};
