import React from "react";
import { useSearchParams } from "react-router-dom";

export const useBudgetLinesList = () => {
    const [filters, setFilters] = React.useState({
        fiscalYears: [],
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
