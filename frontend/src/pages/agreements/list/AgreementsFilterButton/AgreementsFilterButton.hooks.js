import React from "react";

/**
 * A filter for CANs list.
 * @param {import ('./AgreementsFilterTypes').Filters} filters - The current filters.
 * @param {Function} setFilters - A function to call to set the filters.
 */
export const useAgreementsFilterButton = (filters, setFilters) => {
    const [fiscalYear, setFiscalYear] = React.useState([]);
    const [budgetLineStatus, setBudgetLineStatus] = React.useState([]);
    const [portfolio, setPortfolio] = React.useState([]);

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    React.useEffect(() => {
        if (filters.fiscalYear) {
            setFiscalYear(filters.fiscalYear);
        }
    }, [filters.fiscalYear]);

    React.useEffect(() => {
        if (filters.budgetLineStatus) {
            setBudgetLineStatus(filters.budgetLineStatus);
        }
    }, [filters.budgetLineStatus]);

    React.useEffect(() => {
        if (filters.portfolio) {
            setPortfolio(filters.portfolio);
        }
    }, [filters.portfolio]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                fiscalYear: fiscalYear,
                budgetLineStatus: budgetLineStatus,
                portfolio: portfolio,
            };
        });
    };
    const resetFilter = () => {
        setFilters({
            fiscalYear: [],
            budgetLineStatus: [],
            portfolio: [],
        });
    };

    return {
        fiscalYear,
        setFiscalYear,
        portfolio,
        setPortfolio,
        budgetLineStatus,
        setBudgetLineStatus,
        applyFilter,
        resetFilter
    };
};

export default useAgreementsFilterButton;
