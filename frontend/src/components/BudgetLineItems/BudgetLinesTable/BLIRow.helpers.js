/**
 * Returns a CSS class name indicating whether the given budget line item's date is in the future or not.
 * @param {string} item - The budget line item's date.
 * @param {boolean} isReviewMode - Whether the table is in review mode or not.
 * @returns {string} - The CSS class name to apply to the table item.
 */
export const futureDateErrorClass = (item, isReviewMode) => {
    const today = new Date().valueOf();
    const dateNeeded = new Date(item).valueOf();

    if (isReviewMode && dateNeeded < today) {
        return "table-item-error";
    } else {
        return "";
    }
};

/**
 * Adds an error class to a table item if it is not found and the component is in review mode.
 * @param {Object} item - The item to check for existence.
 * @param {boolean} isReviewMode - A flag indicating whether the component is in review mode.
 * @returns {string} - The CSS class to apply to the table item.
 */
export const addErrorClassIfNotFound = (item, isReviewMode) => {
    if (isReviewMode && !item) {
        return "table-item-error";
    } else {
        return "";
    }
};
