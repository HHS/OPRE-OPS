/**
 * Enum for User roles.
 * This object maps the roles that can be assigned to a user to their string representations.
 *
 * @enum {string}
 * @property {string} USER_ADMIN - Represents a user admin role.
 * @property {string} BUDGET_TEAM - Represents a budget team role.
 * @property {string} ADMIN - Represents an admin role.
 * @property {string} DIVISION_DIRECTOR - Represents a division director role.
 * @property {string} USER - Represents a user role.
 * @property {string} UNASSIGNED - Represents an unassigned role.
 */
export const USER_ROLES = {
    USER_ADMIN: "USER_ADMIN",
    BUDGET_TEAM: "BUDGET_TEAM",
    ADMIN: "admin",
    DIVISION_DIRECTOR: "division-director",
    USER: "user",
    UNASSIGNED: "unassigned"
};

/**
 * Enum for User statuses.
 * This object maps the statuses that can be assigned to a user to their string representations.
 * @enum {string}
 * @property {string} ACTIVE - Represents an active status.
 * @property {string} INACTIVE - Represents an inactive status.
 * @property {string} LOCKED - Represents a locked status.
 */
export const USER_STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    LOCKED: "LOCKED"
};
