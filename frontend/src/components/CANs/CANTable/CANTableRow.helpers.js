/**
 * Display active period in years
 * @param {number} activePeriod
 * @returns {string}
 */
export const displayActivePeriod = (activePeriod) => {
    switch (activePeriod) {
        case 0:
            return "TBD";
        case 1:
            return "1 year";
        default:
            return `${activePeriod} years`;
    }
};
