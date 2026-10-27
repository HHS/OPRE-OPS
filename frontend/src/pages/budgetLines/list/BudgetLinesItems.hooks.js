import React from "react";
import { useSearchParams } from "react-router-dom";
import { useListFilters } from "../../../hooks/useListFilters.hooks";

export const useBudgetLinesList = () => {
    const [searchParams] = useSearchParams();

    const [showModal, setShowModal] = React.useState(false);

    // Filters + selected fiscal year persist across client-side navigation via the session slice.
    const { filters, setFilters, selectedFiscalYear, setSelectedFiscalYear } = useListFilters("budgetLines");

    return {
        myBudgetLineItemsUrl: searchParams.get("filter") === "my-budget-lines",
        filters,
        setFilters,
        selectedFiscalYear,
        setSelectedFiscalYear,
        showModal,
        setShowModal
    };
};
