/**
 * Returns the number of decimal spaces to use for a given value.
 * If the value is 0, returns 0 decimal spaces.
 * Otherwise, returns 2 decimal spaces.
 * @param {number} value - The value to determine decimal spaces for.
 * @returns {number} - The number of decimal spaces to use.
 */
export const getDecimalScale = (value) => {
    return value === 0 || value === null ? 0 : 2;
};
