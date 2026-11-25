/**
 * Enum for User status.
 *
 * @enum {string}
 * @property {string} ACTIVE - Represents an active status for a user.
 * @property {string} INACTIVE - Represents an inactive status for a user.
 * @property {string} LOCKED - Represents a locked status for a user.
 */
export const USER_STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    LOCKED: "LOCKED"
};

/**
 * Display labels (sentence case) for each User status.
 *
 * @type {Record<keyof typeof USER_STATUS, string>}
 */
export const USER_STATUS_LABELS = {
    [USER_STATUS.ACTIVE]: "Active",
    [USER_STATUS.INACTIVE]: "Inactive",
    [USER_STATUS.LOCKED]: "Locked"
};
