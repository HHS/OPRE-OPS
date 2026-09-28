import React from "react";

/**
 * A filter for Projects list.
 * @param {import('./ProjectFilterTypes').Filters} filters - The current filters.
 * @param {Function} setFilters - A function to call to set the filters.
 * @param {boolean} showModal - Whether the filter modal is currently open.
 *   Used to reseed local buffers from parent state on each modal open, so that
 *   a Reset-without-Apply followed by re-opening shows the correct current filters.
 * @param {React.MutableRefObject<boolean>} [applyFiredFYRef] - Ref set to true immediately
 *   before applyFilter writes to parent state. Lets the page-level FY reset effect
 *   distinguish tag removal (should revert to "All") from Apply (should preserve the
 *   dropdown's current year).
 */
export const useProjectFilterButton = (filters, setFilters, showModal, applyFiredFYRef) => {
    const [fiscalYear, setFiscalYear] = React.useState(
        /** @type {import('./ProjectFilterTypes').FilterOption[]} */ ([])
    );
    const [portfolio, setPortfolio] = React.useState(/** @type {import('./ProjectFilterTypes').FilterOption[]} */ ([]));
    const [projectSearch, setProjectSearch] = React.useState(
        /** @type {import('./ProjectFilterTypes').FilterOption[]} */ ([])
    );
    const [agreementSearch, setAgreementSearch] = React.useState(
        /** @type {import('./ProjectFilterTypes').FilterOption[]} */ ([])
    );
    const [projectType, setProjectType] = React.useState(
        /** @type {import('./ProjectFilterTypes').FilterOption[]} */ ([])
    );
    // Reseed all local buffers from parent filters when the modal opens.
    // This ensures that a Reset-without-Apply followed by re-opening the modal
    // shows the current active filters, not the cleared-but-unapplied state.
    React.useEffect(() => {
        if (showModal) {
            setFiscalYear(filters.fiscalYear ?? []);
            setPortfolio(filters.portfolio ?? []);
            setProjectSearch(filters.projectSearch ?? []);
            setAgreementSearch(filters.agreementSearch ?? []);
            setProjectType(filters.projectType ?? []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showModal]);

    // Sync local buffers from parent filters whenever parent state changes.
    // This keeps the modal in sync when filter tags are removed (X clicked) externally.
    React.useEffect(() => {
        setFiscalYear(filters.fiscalYear ?? []);
    }, [filters.fiscalYear]);

    React.useEffect(() => {
        setPortfolio(filters.portfolio ?? []);
    }, [filters.portfolio]);

    React.useEffect(() => {
        setProjectSearch(filters.projectSearch ?? []);
    }, [filters.projectSearch]);

    React.useEffect(() => {
        setAgreementSearch(filters.agreementSearch ?? []);
    }, [filters.agreementSearch]);

    React.useEffect(() => {
        setProjectType(filters.projectType ?? []);
    }, [filters.projectType]);

    const applyFilter = () => {
        // Signal to the page-level FY reset effect that this emptying came from Apply,
        // not from tag removal — so it should NOT revert selectedFiscalYear to "All".
        if (applyFiredFYRef) applyFiredFYRef.current = true;
        setFilters(
            /** @param {import('./ProjectFilterTypes').Filters} prevState */
            (prevState) => {
                return {
                    ...prevState,
                    fiscalYear: fiscalYear,
                    portfolio: portfolio,
                    projectSearch: projectSearch,
                    agreementSearch: agreementSearch,
                    projectType: projectType
                };
            }
        );
    };

    const resetFilter = () => {
        // Clear local buffers only — do NOT call setFilters here. This ensures Reset
        // does not fire a query and leaves the page-level FY dropdown unchanged.
        // The cleared state takes effect when the user clicks Apply.
        setFiscalYear([]);
        setPortfolio([]);
        setProjectSearch([]);
        setAgreementSearch([]);
        setProjectType([]);
    };

    return {
        fiscalYear,
        setFiscalYear,
        portfolio,
        setPortfolio,
        projectSearch,
        setProjectSearch,
        agreementSearch,
        setAgreementSearch,
        projectType,
        setProjectType,
        applyFilter,
        resetFilter
    };
};

export default useProjectFilterButton;
