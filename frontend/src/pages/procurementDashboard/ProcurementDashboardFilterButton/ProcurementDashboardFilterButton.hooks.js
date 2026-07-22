import React from "react";

/**
 * @typedef {import('../ProcurementDashboardFilterTypes').Filters} Filters
 */

/**
 * Hook that manages the buffer state for the Procurement Dashboard filter modal.
 * Buffers hold the in-progress selections until Apply is clicked. They are re-seeded
 * from the committed filters whenever the modal opens (discarding edits made in a modal
 * that was closed without Apply) and whenever the committed filters change (e.g. a tag
 * is removed).
 * @param {Filters} filters - The current committed filters.
 * @param {Function} setFilters - A function to call to set the committed filters.
 */
export const useProcurementDashboardFilterButton = (filters, setFilters) => {
    const [procShop, setProcShop] = React.useState(filters.procShop ?? []);
    const [division, setDivision] = React.useState(filters.division ?? []);
    const [showModal, setShowModal] = React.useState(false);

    // Re-seed the buffers from committed filters when the modal opens or when the
    // committed filters change. Coerce to [] so a cleared combobox (the shared ComboBox
    // reports a cleared multi-select as null) never leaves a buffer in a non-array state.
    React.useEffect(() => {
        setProcShop(filters.procShop ?? []);
    }, [filters.procShop, showModal]);

    React.useEffect(() => {
        setDivision(filters.division ?? []);
    }, [filters.division, showModal]);

    // Wrap the buffer setters so a cleared multi-select (null from the shared ComboBox)
    // is stored as an empty array rather than null.
    const setProcShopSafe = (value) => setProcShop(value ?? []);
    const setDivisionSafe = (value) => setDivision(value ?? []);

    const applyFilter = () => {
        setFilters((prevState) => ({
            ...prevState,
            procShop: procShop ?? [],
            division: division ?? []
        }));
    };

    const resetFilter = () => {
        setFilters({
            procShop: [],
            division: []
        });
    };

    return {
        procShop,
        setProcShop: setProcShopSafe,
        division,
        setDivision: setDivisionSafe,
        showModal,
        setShowModal,
        applyFilter,
        resetFilter
    };
};

export default useProcurementDashboardFilterButton;
