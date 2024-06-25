/**
 * Enum for change request actions.
 * This object maps the actions that can be taken on a change request to their string representations.
 *
 * @enum {string}
 * @property {string} APPROVE - Represents an approval action for a change request.
 * @property {string} REJECT - Represents a rejection action for a change request.
 */
export const CHANGE_REQUEST_ACTION = {
    APPROVE: "APPROVE",
    REJECT: "REJECT"
};
/**
 * Enum for change request types.
 * This object maps the types of change requests to their string representations.
 * @enum {string}
 * @property {string} BUDGET - Represents a budget change request.
 * @property {string} STATUS - Represents a status change request.
 */
export const CHANGE_REQUEST_TYPES = {
    BUDGET: "Budget Change",
    STATUS: "Status Change"
};
