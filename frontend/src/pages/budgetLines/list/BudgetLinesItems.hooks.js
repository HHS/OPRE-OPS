import React from "react";
import { useSearchParams } from "react-router-dom";

export const useBudgetLinesList = () => {
    const [searchParams] = useSearchParams();

    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState("All");
    const [showModal, setShowModal] = React.useState(false);

    const [filters, setFilters] = React.useState(() => ({
        fiscalYears: [],
        portfolios: [],
        bliStatus: [],
        budgetRange: null,
        agreementTypes: [],
        agreementTitles: [],
        canActivePeriods: []
    }));

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
