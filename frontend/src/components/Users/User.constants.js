/**
 * Enum for User roles.
 * This object maps the roles that can be assigned to a user to their string representations.
 *
 * @enum {string}
 * @property {string} USER_ADMIN - Represents a user admin role.
 * @property {string} BUDGET_TEAM - Represents a budget team role.
 * @property {string} SYSTEM_OWNER - Represents a System Owner role.
 * @property {string} REVIEWER_APPROVER - Represents a Reviewer/Approver role.
 * @property {string} VIEWER_EDITOR - Represents a basic user role.
 */
export const USER_ROLES = {
    USER_ADMIN: "USER_ADMIN",
    BUDGET_TEAM: "BUDGET_TEAM",
    SYSTEM_OWNER: "SYSTEM_OWNER",
    REVIEWER_APPROVER: "REVIEWER_APPROVER",
    VIEWER_EDITOR: "VIEWER_EDITOR"
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
