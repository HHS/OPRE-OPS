import React from "react";
import { getCurrentFiscalYear } from "../../../../helpers/utils";

/**
 * A filter for Projects list.
 * @param {import('./ProjectFilterTypes').Filters} filters - The current filters.
 * @param {Function} setFilters - A function to call to set the filters.
 */
export const useProjectFilterButton = (filters, setFilters) => {
    const [fiscalYear, setFiscalYear] = React.useState(/** @type {import('./ProjectFilterTypes').FilterOption[]} */ ([]));
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
