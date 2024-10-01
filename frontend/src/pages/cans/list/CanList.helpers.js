/**
 * Sorts an array of CANs by obligateBy date in descending order.
 * @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
 * @param {CAN[]} cans - The array of CANs to sort.
 * @returns {CAN[]} The sorted array of CANs.
 */
export const sortCANs = (cans) => {
    if (!cans || cans.length === 0) {
        return [];
    }
    return [...cans].sort((a, b) => {
        const dateA = a.obligate_by ? new Date(a.obligate_by).getTime() : 0;
        const dateB = b.obligate_by ? new Date(b.obligate_by).getTime() : 0;
        return dateB - dateA;
    });
};
