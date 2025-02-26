import { useState, useEffect, useCallback } from "react";
/**
 * @typedef {Object} FilterItem
 * @property {string} title
 */

/**
 * @typedef {Object} Filters
 * @property {FilterItem[]} fiscalYear
 * @property {FilterItem[]} portfolio
 * @property {FilterItem[]} budgetLineStatus
 */

/**
 * @typedef {Object} Tag
 * @property {string} tagText
 * @property {string} filter
 */

/**
 * Custom hook for managing tags list
 * @param {Filters} filters
 * @returns {Tag[]}
 */
export const useTagsList = (filters) => {
    const [tagsList, setTagsList] = useState([]);

    /**
     * @param {keyof Filters} filterKey
     * @param {string} filterName
     */
    const updateTags = useCallback(
        (filterKey, filterName) => {
            if (Array.isArray(filters[filterKey])) {
                const selectedTags = filters[filterKey].map((item) => ({
                    tagText: item.title,
                    filter: filterName
                }));
                setTagsList((prevState) => [...prevState.filter((t) => t.filter !== filterName), ...selectedTags]);
            }else{
                setTagsList((prevState) => [...prevState.filter((t) => t.filter !== filterName)]);
            }
        },
        [filters]
    );

    useEffect(() => {
        updateTags("fiscalYear", "fiscalYear");
    }, [filters.fiscalYear, updateTags]);

    useEffect(() => {
        updateTags("portfolio", "portfolio");
    }, [filters.portfolio, updateTags]);

    useEffect(() => {
        updateTags("budgetLineStatus", "budgetLineStatus");
    }, [filters.budgetLineStatus, updateTags]);

    return tagsList;
};

/**
 * Removes a filter tag
 * @param {Tag} tag - The tag to remove
 * @param {function(function(Filters): Filters): void} setFilters - Function to update filters
 */
export const removeFilter = (tag, setFilters) => {
    switch (tag.filter) {
        case "fiscalYear":
            setFilters((prevState) => ({
                ...prevState,
                fiscalYear: prevState.fiscalYear.filter((fiscalYear) => fiscalYear.title !== tag.tagText)
            }));
            break;
        case "portfolio":
            setFilters((prevState) => ({
                ...prevState,
                portfolio: prevState.portfolio.filter((portfolio) => portfolio.title !== tag.tagText)
            }));
            break;
        case "budgetLineStatus":
            setFilters((prevState) => ({
                ...prevState,
                transfer: prevState.budgetLineStatus.filter((budgetLineStatus) => budgetLineStatus.title !== tag.tagText)
            }));
            break;
        default:
            console.warn(`Unknown filter type: ${tag.filter}`);
    }
};
