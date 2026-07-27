import React from "react";
import { useSearchParams } from "react-router-dom";
import { getFiscalYearHelpers } from "./fiscalYearFilterHelpers";
import { useListFilters } from "../../../hooks/useListFilters.hooks";

export const useBudgetLinesList = () => {
    const [searchParams] = useSearchParams();

    // ============================================
    // TEMPORARY: A/B Testing Fiscal Year Filter
    // Query param: ?filterMode=explicit-all
    // ============================================
    const useApproachB = searchParams.get("filterMode") === "explicit-all";
    // Memoize helpers to avoid unnecessary re-renders
    const fyHelpers = React.useMemo(() => getFiscalYearHelpers(useApproachB), [useApproachB]);

    // Filters persist across client-side navigation via the session slice. The
    // fiscalYears default (null) matches fyHelpers.getInitialState() for both
    // A/B approaches, so the derived helpers stay here, out of the slice.
    const { filters, setFilters } = useListFilters("budgetLines");

    return {
        myBudgetLineItemsUrl: searchParams.get("filter") === "my-budget-lines",
        filters,
        setFilters,
        useApproachB,
        fyHelpers
    };
};
