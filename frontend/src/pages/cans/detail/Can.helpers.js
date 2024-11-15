/**
 * @typedef ItemCount
 * @property {string} type
 * @property {number} count
 */

/**
 * Counts the occurrences of each type in the given array of items based on the specified key.
 *
 * @param {Object[]} items - The array of items to count types from.
 * @param {string} keyToCount - The key in each item to count occurrences of.
 * @returns {ItemCount[]} An array of objects, each containing a type and its count.
 */
export const getTypesCounts = (items, keyToCount) => {
    if (!items || items.length === 0) return [];

    return Object.entries(
        items.reduce((acc, item) => {
            const type = item[keyToCount];
            if (!acc[type]) {
                acc[type] = 0;
            }
            acc[type]++;
            return acc;
        }, {})
    ).map(([type, count]) => ({ type, count }));
};
