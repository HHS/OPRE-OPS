import _ from "lodash";

/**
 * Sorts an array of CANs by obligateBy date in descending order.
 * @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
 * @param {CAN[]} cans - The array of CANs to sort.
 * @param {boolean} myCANsUrl - The URL parameter to filter by "my-CANs".
 * @param {import("../../../components/Users/UserTypes").User} activeUser - The active user.
 * @returns {CAN[] | undefined} - The sorted array of CANs.
 */
export const sortAndFilterCANs = (cans, myCANsUrl, activeUser) => {
    let sortedCANs = [];
    if (!cans || cans.length === 0) {
        return [];
    }
    let filteredCANs = _.cloneDeep(cans);
    if (myCANsUrl) {
        // can.portfolio.division_id === activeUser.division_id
        const myCANs = filteredCANs.filter((can) => can.portfolio.division_id === activeUser.division);
        sortedCANs = sortCANs(myCANs);
    } else {
        // all CANs
        sortedCANs = sortCANs(filteredCANs);
    }
    return sortedCANs;
};

/**
 * Sorts an array of CANs by obligateBy date in descending order.
 * @param {CAN[]} cans - The array of CANs to sort.
 * @returns {CAN[] | []} - The sorted array of CANs.
 */
const sortCANs = (cans) => {
    if (!cans) {
        return [];
    }

    return [...cans].sort((a, b) => {
        const dateA = a.obligate_by ? new Date(a.obligate_by).getTime() : 0;
        const dateB = b.obligate_by ? new Date(b.obligate_by).getTime() : 0;
        return dateB - dateA;
    });
};
