/**
 * Fiscal-year label used across the Project Spending tab, e.g. "FY 2044" or "All FYs".
 *
 * @param {number | "All"} fiscalYear
 * @returns {string}
 */
export const getFyLabel = (fiscalYear) => (fiscalYear === "All" ? "All FYs" : `FY ${fiscalYear}`);

/**
 * Resolves a fiscal-year-keyed map of numbers to a single total.
 * Under "All FYs" sums every year; otherwise returns just the selected year's value
 * (0 if that year has no entry).
 *
 * @param {Record<string, number> | undefined} fyMap
 * @param {number | "All"} fiscalYear
 * @returns {number}
 */
export const sumAcrossFy = (fyMap, fiscalYear) =>
    fiscalYear === "All"
        ? Object.values(fyMap ?? {}).reduce((sum, v) => sum + Number(v), 0)
        : Number(fyMap?.[fiscalYear] ?? 0);
