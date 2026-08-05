import { useMemo } from "react";

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
 * Builds the tags for a single filter's selected items. Returns an empty array when the
 * value is not a populated array.
 * @param {any[]} items - The selected items for the filter.
 * @param {keyof Filters} filterKey
 * @param {(item: any) => string} getTagText
 * @returns {Tag[]}
 */
const buildTags = (items, filterKey, getTagText) =>
    Array.isArray(items)
        ? items.map((item) => ({
              tagText: getTagText(item),
              filter: filterKey,
              id: item.id
          }))
        : [];

/**
 * Custom hook for deriving the Procurement Dashboard filter tags list. The list is
 * fully derived from the filters, so it is computed synchronously with useMemo rather
 * than mirrored into state via effects.
 * @param {Filters} filters
 * @returns {Tag[]}
 */
export const useTagsList = ({ procShop, division }) => {
    return useMemo(
        () => [
            ...buildTags(procShop, "procShop", (shop) => shop.abbr),
            ...buildTags(division, "division", (item) => item.name)
        ],
        [procShop, division]
    );
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
