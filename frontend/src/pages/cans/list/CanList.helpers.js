import { USER_ROLES } from "../../../components/Users/User.constants";
/**
 * @typedef {Object} FilterOption
 * @property {number} id
 * @property {number|string} title
 */
/**
 * @typedef {Object} Filters
 * @property {FilterOption[]} [activePeriod]
 * // Add other filter types here
 */

/**
 * Sorts an array of CANs by obligateBy date in descending order.
 * @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
 * @param {CAN[]} cans - The array of CANs to sort.
 * @param {boolean} myCANsUrl - The URL parameter to filter by "my-CANs".
 * @param {import("../../../components/Users/UserTypes").User} activeUser - The active user.
 * @param {Filters} filters - The filters to apply.
 * @returns {CAN[]} - The sorted array of CANs.
 */
export const sortAndFilterCANs = (cans, myCANsUrl, activeUser, filters) => {
    if (!cans || cans.length === 0) {
        return [];
    }

    const { roles, id: userId, division: userDivisionId } = activeUser;
    // NOTE: Role-based filtering
    let filteredCANs = cans.filter((can) => {
        // Always include CAN if the user is not filtering by "my-CANs"
        if (!myCANsUrl) return true;

        // Check if user has any role that allows access to all CANs
        if (roles.some((role) => [USER_ROLES.ADMIN].includes(role))) return true;

        // Filter based on specific roles division directors and budget team
        if (roles.includes(USER_ROLES.DIVISION_DIRECTOR || USER_ROLES.BUDGET_TEAM)) {
            return can.portfolio.division_id === userDivisionId;
        }
        // Filter based on team members
        // TODO: add project officers per #2884
        if (roles.includes(USER_ROLES.USER)) {
            return can.budget_line_items.some((bli) => bli.team_members.some((member) => member.id === userId));
        }

        // If no specific role matches, don't include the CAN
        return false;
    });

    // NOTE: Filter by filter prop
    filteredCANs = applyAdditionalFilters(filteredCANs, filters);

    return sortCANs(filteredCANs);
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

/**
 * Applies additional filters to the CANs.
 * @param {CAN[]} cans - The array of CANs to filter.
 * @param {Filters} filters - The filters to apply.
 * @returns {CAN[]} - The filtered array of CANs.
 */
const applyAdditionalFilters = (cans, filters) => {
    let filteredCANs = cans;

    // Filter by active period
    if (filters.activePeriod && filters.activePeriod.length > 0) {
        filteredCANs = filteredCANs.filter((can) =>
            filters.activePeriod?.some((period) => period.id === can.active_period)
        );
    }

    // TODO: Add other filters here
    // Example:
    // if (filters.someOtherFilter && filters.someOtherFilter.length > 0) {
    //     filteredCANs = filteredCANs.filter((can) => {
    //         // Apply some other filter logic
    //     });
    // }

    return filteredCANs;
};
