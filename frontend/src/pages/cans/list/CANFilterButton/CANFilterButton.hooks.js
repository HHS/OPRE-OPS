import React from "react";

/**
 * Compares two numeric ranges by value. The slider allocates a NEW array on every drag
 * (CANFYBudgetRangeSlider.jsx:58), so the old reference check never matched after any drag —
 * dragging both thumbs back to the ends left a stale full-range budget tag.
 * Values are rounded because fyBudgetRange can be fractional (CanList.jsx:143-145 widens a
 * single-value range by ±10%) while the slider emits Math.round()-ed values (:46).
 * Non-finite values never compare equal, so a NaN range is never treated as "full range".
 */
const isSameRange = (a, b) =>
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every(
        (value, index) =>
            Number.isFinite(value) && Number.isFinite(b[index]) && Math.round(value) === Math.round(b[index])
    );

/**
 * A filter for CANs list.
 * @param {import ('./CANFilterTypes').Filters} filters - The current filters.
 * @param {Function} setFilters - A function to call to set the filters.
 * @param {[number, number]} fyBudgetRange - The fiscal year budget range.
 * @param {boolean} showModal - Whether the filter modal is currently open.
 */
export const useCANFilterButton = (filters, setFilters, fyBudgetRange, showModal) => {
    const [activePeriod, setActivePeriod] = React.useState([]);
    const [transfer, setTransfer] = React.useState([]);
    const [portfolio, setPortfolio] = React.useState([]);
    const [can, setCan] = React.useState([]);
    const [budget, setBudget] = React.useState([]);

    // Reseed all local buffers from parent filters when the modal opens. Reset no longer
    // writes to parent state, so without this a Reset-without-Apply would still be showing
    // on the next open.
    React.useEffect(() => {
        if (showModal) {
            setActivePeriod(filters.activePeriod ?? []);
            setTransfer(filters.transfer ?? []);
            setPortfolio(filters.portfolio ?? []);
            setCan(filters.can ?? []);
            // The slider destructures `const [minValue, maxValue] = budget`, so this buffer must
            // never be [] — "no budget filter" is represented by the full range.
            setBudget(
                Array.isArray(filters.budget) && filters.budget.length === 2
                    ? [filters.budget[0], filters.budget[1]]
                    : fyBudgetRange
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showModal]);

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    React.useEffect(() => {
        setActivePeriod(filters.activePeriod ?? []);
    }, [filters.activePeriod]);

    React.useEffect(() => {
        setTransfer(filters.transfer ?? []);
    }, [filters.transfer]);

    React.useEffect(() => {
        setPortfolio(filters.portfolio ?? []);
    }, [filters.portfolio]);

    React.useEffect(() => {
        setCan(filters.can ?? []);
    }, [filters.can]);

    // Sync the budget buffer when the applied budget filter changes (tag X clicked, or Apply
    // committed a value) or when the page-level FY changes the available range.
    React.useEffect(() => {
        if (Array.isArray(filters.budget) && filters.budget.length === 2) {
            setBudget([filters.budget[0], filters.budget[1]]);
        } else if (Array.isArray(fyBudgetRange)) {
            setBudget(fyBudgetRange);
        }
    }, [fyBudgetRange, filters.budget]);

    const applyFilter = () => {
        // Always commit the current modal state, including budget: an empty modal must clear
        // every active filter and tag. A slider left at (or dragged back to) the full FY range
        // means "no budget filter" → write [] so the tag clears and budgetMin/budgetMax are
        // omitted from the query.
        setFilters((prevState) => ({
            ...prevState,
            activePeriod: activePeriod ?? [],
            transfer: transfer ?? [],
            portfolio: portfolio ?? [],
            can: can ?? [],
            budget: isSameRange(budget, fyBudgetRange) ? [] : budget
        }));
    };
    const resetFilter = () => {
        // Clear local buffers only — do NOT call setFilters here. Reset fires no query and leaves
        // the page-level FY dropdown untouched; the cleared state is committed on Apply.
        setActivePeriod([]);
        setTransfer([]);
        setPortfolio([]);
        setCan([]);
        // Not [] — the slider would render $ NaN. Full range == "no budget filter", which
        // applyFilter converts to [].
        setBudget(fyBudgetRange);
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
