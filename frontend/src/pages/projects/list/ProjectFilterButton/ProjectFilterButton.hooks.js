import React from "react";
import { getCurrentFiscalYear } from "../../../../helpers/utils";

/**
 * A filter for Projects list.
 * @param {import('./ProjectFilterTypes').Filters} filters - The current filters.
 * @param {Function} setFilters - A function to call to set the filters.
 * @param {boolean} showModal - Whether the modal is currently open.
 */
export const useProjectFilterButton = (filters, setFilters, showModal) => {
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
    const currentFiscalYear = getCurrentFiscalYear();

    // Reset local state to match filters when modal opens (prevents stale selections from persisting)
    React.useEffect(() => {
        if (showModal) {
            setFiscalYear(filters.fiscalYear ?? []);
            setPortfolio(filters.portfolio ?? []);
            setProjectSearch(filters.projectSearch ?? []);
            setAgreementSearch(filters.agreementSearch ?? []);
            setProjectType(filters.projectType ?? []);
        }
    }, [showModal, filters]);

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    React.useEffect(() => {
        if (filters.fiscalYear) {
            setFiscalYear(filters.fiscalYear);
        }
    }, [filters.fiscalYear]);

    React.useEffect(() => {
        if (filters.portfolio) {
            setPortfolio(filters.portfolio);
        }
    }, [filters.portfolio]);

    React.useEffect(() => {
        if (filters.projectSearch) {
            setProjectSearch(filters.projectSearch);
        }
    }, [filters.projectSearch]);

    React.useEffect(() => {
        if (filters.agreementSearch) {
            setAgreementSearch(filters.agreementSearch);
        }
    }, [filters.agreementSearch]);

    React.useEffect(() => {
        if (filters.projectType) {
            setProjectType(filters.projectType);
        }
    }, [filters.projectType]);

    const applyFilter = () => {
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
        setFilters({
            fiscalYear: [],
            portfolio: [],
            projectSearch: [],
            agreementSearch: [],
            projectType: []
        });
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
        resetFilter,
        currentFiscalYear
    };
};

export default useProjectFilterButton;
