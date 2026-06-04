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

/**
 * Formats a numeric value as a USD currency string.
 * If value is null or undefined, treats it as 0.
 * Displays 0 decimal places for 0, otherwise 2 decimal places.
 * @param {number} value - The value to format as currency.
 * @returns {string} - The formatted currency string (e.g., "$1,234.50").
 */
export const formatCurrency = (value) => {
    const num = value ?? 0;
    const decimals = num === 0 ? 0 : 2;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
};
