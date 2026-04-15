/**
 * Enum for procurement tracker step statuses.
 * These statuses track the progress of individual steps in a procurement tracker workflow.
 *
 * @enum {string}
 * @property {string} PENDING - Step has not been started or is awaiting action
 * @property {string} ACTIVE - Step is currently being worked on (typically the active_step_number in tracker)
 * @property {string} COMPLETED - Step has been finished and validated
 * @property {string} SKIPPED - Step was intentionally skipped in the workflow (defined in types but not currently used)
 */
export const PROCUREMENT_STEP_STATUS = {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
    SKIPPED: "SKIPPED"
};

/**
 * Enum for procurement tracker statuses (tracker-level, not step-level).
 * These statuses apply to the entire procurement tracker entity.
 *
 * @enum {string}
 * @property {string} ACTIVE - Tracker is currently in use for the agreement
 * @property {string} INACTIVE - Tracker has been deactivated
 * @property {string} COMPLETED - All steps in the tracker are complete
 */
export const PROCUREMENT_TRACKER_STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    COMPLETED: "COMPLETED"
};

/**
 * Enum for pre-award approval status.
 * @enum {string}
 * @property {string} PENDING - Approval is pending
 * @property {string} REQUESTED - Approval has been requested
 * @property {string} APPROVED - Approval has been granted
 * @property {string} DECLINED - Approval has been declined
 * @property {string} CANCELLED - Approval request has been cancelled
 */
export const ProcurementTrackerPreAwardApprovalStatus = {
    PENDING: "PENDING",
    REQUESTED: "REQUESTED",
    APPROVED: "APPROVED",
    DECLINED: "DECLINED",
    CANCELLED: "CANCELLED"
};
