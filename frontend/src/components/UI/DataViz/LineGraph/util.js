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
