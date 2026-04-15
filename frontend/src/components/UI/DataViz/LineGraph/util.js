/**
 * @typedef {Object} Data
 * @property {number} expected The expected value
 * @property {number} received The received value
 */

/**
 *
 * @param {Data} data
 * @returns {number} The ratio of received to expected
 */
export const calculateRatio = (data) => {
    if (!("expected" in data) || !("received" in data)) {
        console.error("data is malformed.");
        return 0;
    }

    if (data.received === 0) {
        return 0;
    } else if (data.expected === 0) {
        return 10000;
    } else {
        return data.received / data.expected;
    }
};

/**
 * Resolves the numeric flex-basis width (0–100) for the left bar in a two-bar
 * line graph, using a backwards-compatible strategy:
 *
 * 1. If `leftPercent` is a finite number, use it directly — preserves existing
 *    behaviour for callers (e.g. BudgetCard, CanCard) that pre-compute a correct
 *    percent and pass `totalFunding` (not the complement) as the right `value`.
 * 2. If `leftPercent` is a display string (">99" / "<1"), derive the width from
 *    `leftValue / (leftValue + rightValue)` — these callers (PortfolioFunding,
 *    CANSummaryCards) pass complementary values so the sum is the correct total.
 *
 * A 2% minimum floor is applied so a non-zero bar is never invisible.
 *
 * @param {number|string} leftPercent
 * @param {number} leftValue
 * @param {number} rightValue
 * @returns {number}
 */
export const resolveLeftFlexWidth = (leftPercent, leftValue, rightValue) => {
    const MIN_WIDTH = 2;

    if (typeof leftPercent === "number" && Number.isFinite(leftPercent)) {
        const raw = leftPercent;
        if (raw > 0 && raw < MIN_WIDTH) return MIN_WIDTH;
        if (100 - raw > 0 && 100 - raw < MIN_WIDTH) return 100 - MIN_WIDTH;
        return raw;
    }

    // Fall back to value-proportional width for display strings (">99" / "<1")
    const total = (leftValue ?? 0) + (rightValue ?? 0);
    if (total === 0) return 0;
    const raw = ((leftValue ?? 0) / total) * 100;
    const rightRaw = ((rightValue ?? 0) / total) * 100;
    if (raw > 0 && raw < MIN_WIDTH) return MIN_WIDTH;
    if (rightRaw > 0 && rightRaw < MIN_WIDTH) return 100 - MIN_WIDTH;
    return raw;
};
