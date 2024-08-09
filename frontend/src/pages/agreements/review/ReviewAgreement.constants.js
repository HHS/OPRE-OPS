/**
 * Enums for action options in the agreement review page.
 * @enum {string}
 * @property {string} CHANGE_DRAFT_TO_PLANNED - The label for changing draft budget lines to planned status.
 * @property {string} CHANGE_PLANNED_TO_EXECUTING - The label for changing planned budget lines to executing status.
 */
export const actionOptions = {
    CHANGE_DRAFT_TO_PLANNED: "Change Draft Budget Lines to Planned Status",
    CHANGE_PLANNED_TO_EXECUTING: "Change Planned Budget Lines to Executing Status"
};
/**
 * Enum for selected actions in the agreement review page.
 * @enum {string}
 * @property {string} DRAFT_TO_PLANNED - The action for changing draft budget lines to planned status.
 * @property {string} PLANNED_TO_EXECUTING - The action for changing planned budget lines to executing status
 */
export const selectedAction = {
    DRAFT_TO_PLANNED: "DRAFT_TO_PLANNED",
    PLANNED_TO_EXECUTING: "PLANNED_TO_EXECUTING"
};
