import React from "react";

/**
 * A filter for CANs list.
 * @param {import ('./CANFilterTypes').Filters} filters - The current filters.
 * @param {Function} setFilters - A function to call to set the filters.
 */
export const useCANFilterButton = (filters, setFilters) => {
    const [activePeriod, setActivePeriod] = React.useState([]);
    const [transfer, setTransfer] = React.useState([]);
    const [portfolio, setPortfolio] = React.useState([]);
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
        if (filters.budget) {
            setBudget(filters.budget);
        }
    }, [filters.budget]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                activePeriod: activePeriod,
                transfer: transfer,
                portfolio: portfolio,
                budget: budget
            };
        });
    };
    const resetFilter = () => {
        setFilters({
            activePeriod: [],
            transfer: [],
            portfolio: [],
            budget: []
        });
        setActivePeriod([]);
        setTransfer([]);
        setPortfolio([]);
        setBudget([]);
    };

    return {
        activePeriod,
        setActivePeriod,
        transfer,
        setTransfer,
        portfolio,
        setPortfolio,
        budget,
        setBudget,
        applyFilter,
        resetFilter
    };
};

export default useCANFilterButton;
