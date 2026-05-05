import { useMemo } from "react";

/**
 * @typedef {import("../ProjectFilterButton/ProjectFilterTypes.d.ts").Filters} Filters
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
    const tagsList = useMemo(() => {
        // Map each filter key to the property name we need to extract
        const propertyMap = {
            portfolio: "name",
            fiscalYear: "title",
            projectSearch: "title",
            agreementSearch: "title",
            projectType: "title"
        };

        // Transform all filters into tags in one pass
        return Object.entries(propertyMap).flatMap(([filterKey, propertyName]) =>
            (filters[filterKey] ?? []).map((item) => ({
                tagText: item[propertyName],
                filter: filterKey
            }))
        );
    }, [filters]);

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
                portfolio: prevState.portfolio.filter((portfolio) => portfolio.name !== tag.tagText)
            }));
            break;
        case "projectSearch":
            setFilters((prevState) => ({
                ...prevState,
                projectSearch: prevState.projectSearch.filter((project) => project.title !== tag.tagText)
            }));
            break;
        case "agreementSearch":
            setFilters((prevState) => ({
                ...prevState,
                agreementSearch: prevState.agreementSearch.filter((agreement) => agreement.title !== tag.tagText)
            }));
            break;
        case "projectType":
            setFilters((prevState) => ({
                ...prevState,
                projectType: prevState.projectType.filter((type) => type.title !== tag.tagText)
            }));
            break;
    }
};
