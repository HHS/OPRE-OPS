/**
 * Formats a numeric value as a USD currency string.
 *
 * - null, undefined, and non-finite values (NaN, Infinity) coerce to 0.
 * - String inputs are coerced via Number(); unparseable strings coerce to 0.
 * - 0 renders without decimals ("$0"); other values render with two ("$1,234.50").
 *
 * @param {number|string|null|undefined} value - The value to format.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (value) => {
    const coerced = value == null ? 0 : Number(value);
    const num = Number.isFinite(coerced) ? coerced : 0;
    const decimals = num === 0 ? 0 : 2;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
};
