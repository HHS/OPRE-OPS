import React from "react";
import { useSearchParams } from "react-router-dom";
import { getFiscalYearHelpers } from "./fiscalYearFilterHelpers";

export const useBudgetLinesList = () => {
    const [searchParams] = useSearchParams();

    // ============================================
    // TEMPORARY: A/B Testing Fiscal Year Filter
    // Query param: ?filterMode=explicit-all
    // ============================================
    const useApproachB = searchParams.get("filterMode") === "explicit-all";
    const fyHelpers = getFiscalYearHelpers(useApproachB);

    // Initialize with approach-specific initial state
    const [filters, setFilters] = React.useState({
        fiscalYears: fyHelpers.getInitialState(),
        portfolios: [],
        bliStatus: [],
        budgetRange: null,
        agreementTypes: [],
        agreementTitles: [],
        canActivePeriods: []
    });

    return {
        myBudgetLineItemsUrl: searchParams.get("filter") === "my-budget-lines",
        filters,
        setFilters,
        useApproachB,
        fyHelpers
    };
};
