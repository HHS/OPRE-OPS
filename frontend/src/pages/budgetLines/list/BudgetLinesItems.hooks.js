import React from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

export const useBudgetLinesList = () => {
    const activeUser = useSelector((state) => state?.auth?.activeUser);
    const [filters, setFilters] = React.useState({
        fiscalYears: [],
        portfolios: [],
        bliStatus: []
    });
    const [searchParams] = useSearchParams();
    searchParams.get("filter") === "my-budget-lines";

    return {
        myBudgetLineItemsUrl: searchParams.get("filter") === "my-budget-lines",
        activeUser,
        filters,
        setFilters
    };
};
