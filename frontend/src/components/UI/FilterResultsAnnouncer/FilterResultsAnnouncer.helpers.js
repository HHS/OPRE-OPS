/**
 * Counts the selected filter values: each array item, or 1 for any other set value.
 * @param {Object} filters - A list page's filters.
 * @returns {number} - The number of selected values.
 */
export const countFilterValues = (filters) =>
    Object.values(filters ?? {}).reduce((total, value) => {
        if (Array.isArray(value)) return total + value.length;
        return value === null || value === undefined ? total : total + 1;
    }, 0);

/**
 * Describes a filter change by comparing the number of selected values before and after.
 * @param {number} previousCount - The number of selected values before the change.
 * @param {number} nextCount - The number of selected values after the change.
 * @returns {string} - The change, as the start of the announcement.
 */
export const describeFilterChange = (previousCount, nextCount) => {
    if (nextCount === 0) return "Filters cleared.";
    if (nextCount < previousCount) return "Filter removed.";
    return "Filters applied.";
};
