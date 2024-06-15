/**
 * Returns an object with a background color property that changes based on whether the row is expanded or not.
 * @param {boolean} isExpanded - Whether the row is expanded or not.
 * @returns {string} - An object with a backgroundColor property.
 */
export const removeBorderBottomIfExpanded = (isExpanded) => (isExpanded ? "border-bottom-none" : "");

/**
 * Returns an object with a background color property that changes based on whether the row is expanded or not.
 * @param {boolean} isExpanded - Whether the row is expanded or not.
 * @returns {Object} - An object with a backgroundColor property.
 */
export const changeBgColorIfExpanded = (isExpanded) => ({
    backgroundColor: isExpanded ? "var(--neutral-lightest)" : ""
});
