import { useState, useEffect, useCallback } from "react";

/**
 * @typedef {import('../ProcurementDashboardFilterTypes').Filters} Filters
 */

/**
 * @typedef {Object} Tag
 * @property {string} tagText - The display text for the tag.
 * @property {string} filter - The filter key this tag belongs to.
 * @property {number} id - The id of the underlying item; used as the unique removal key.
 */

/**
 * Custom hook for managing the Procurement Dashboard filter tags list.
 * @param {Filters} filters
 * @returns {Tag[]}
 */
export const useTagsList = (filters) => {
    const [tagsList, setTagsList] = useState([]);

    /**
     * @param {keyof Filters} filterKey
     * @param {(item: any) => string} getTagText
     */
    const updateTags = useCallback(
        (filterKey, getTagText) => {
            if (Array.isArray(filters[filterKey])) {
                const selectedTags = filters[filterKey].map((item) => ({
                    tagText: getTagText(item),
                    filter: filterKey,
                    id: item.id
                }));
                setTagsList((prevState) => [...prevState.filter((t) => t.filter !== filterKey), ...selectedTags]);
            } else {
                setTagsList((prevState) => prevState.filter((t) => t.filter !== filterKey));
            }
        },
        [filters]
    );

    useEffect(() => {
        updateTags("procShop", (shop) => shop.abbr);
    }, [filters.procShop, updateTags]);

    useEffect(() => {
        updateTags("division", (division) => division.name);
    }, [filters.division, updateTags]);

    return tagsList;
};

/**
 * Removes a filter tag. Removal is keyed on the item id (unique) rather than the display
 * text, so items with a missing or duplicated label are still removed individually.
 * @param {Tag} tag - The tag to remove.
 * @param {function(function(Filters): Filters): void} setFilters - Function to update filters.
 */
export const removeFilter = (tag, setFilters) => {
    switch (tag.filter) {
        case "procShop":
            setFilters((prevState) => ({
                ...prevState,
                procShop: prevState.procShop.filter((shop) => shop.id !== tag.id)
            }));
            break;
        case "division":
            setFilters((prevState) => ({
                ...prevState,
                division: prevState.division.filter((division) => division.id !== tag.id)
            }));
            break;
        default:
            console.warn(`Unknown filter type: ${tag.filter}`);
    }
};
