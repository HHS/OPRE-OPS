import React from "react";

/**
 * A filter for CANs list.
 * @param {import ('./CANFilterTypes').Filters} filters - The current filters.
 * @param{[number, number]} fyBudgetRange - The fiscal year budget range.
 * @param {Function} setFilters - A function to call to set the filters.
 */
export const useCANFilterButton = (filters, setFilters, fyBudgetRange) => {
    const [activePeriod, setActivePeriod] = React.useState([]);
    const [transfer, setTransfer] = React.useState([]);
    const [portfolio, setPortfolio] = React.useState([]);
    const [can, setCan] = React.useState([]);
    const [budget, setBudget] = React.useState([]);

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    React.useEffect(() => {
        if (filters.activePeriod) {
            setActivePeriod(filters.activePeriod);
        }
    }, [filters.activePeriod]);

    React.useEffect(() => {
        if (filters.transfer) {
            setTransfer(filters.transfer);
        }
    }, [filters.transfer]);

    React.useEffect(() => {
        if (filters.portfolio) {
            setPortfolio(filters.portfolio);
        }
    }, [filters.portfolio]);

    React.useEffect(() => {
        if (filters.can) {
            setCan(filters.can);
        }
    }, [filters.can]);

    React.useEffect(() => {
        if (fyBudgetRange !== undefined) {
            setBudget(fyBudgetRange);
        }
        if (filters.budget && Array.isArray(filters.budget) && filters.budget.length === 2) {
            setBudget([filters.budget[0], filters.budget[1]]);
        }
    }, [fyBudgetRange, filters.budget]);

    const applyFilter = () => {
        if (budget === fyBudgetRange) {
            setFilters((prevState) => {
                return {
                    ...prevState,
                    activePeriod: activePeriod,
                    transfer: transfer,
                    portfolio: portfolio,
                    can: can
                };
            });
        } else {
            setFilters((prevState) => {
                return {
                    ...prevState,
                    activePeriod: activePeriod,
                    transfer: transfer,
                    portfolio: portfolio,
                    can: can,
                    budget: budget
                };
            });
        }
    };
    const resetFilter = () => {
        setFilters({
            activePeriod: [],
            transfer: [],
            portfolio: [],
            can: [],
            budget: []
        });
    };

    return {
        activePeriod,
        setActivePeriod,
        transfer,
        setTransfer,
        portfolio,
        setPortfolio,
        can,
        setCan,
        budget,
        setBudget,
        applyFilter,
        resetFilter
    };
};

export default useCANFilterButton;
