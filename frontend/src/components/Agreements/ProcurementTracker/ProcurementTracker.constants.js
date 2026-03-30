/**
 * Enum for procurement tracker step status.
 * @enum {string}
 * @property {string} PENDING - Step is pending
 * @property {string} ACTIVE - Step is currently active
 * @property {string} COMPLETED - Step has been completed
 * @property {string} SKIPPED - Step was skipped
 */
export const ProcurementTrackerStepStatus = {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
    SKIPPED: "SKIPPED"
};

/**
 * Enum for procurement tracker status.
 * @enum {string}
 * @property {string} ACTIVE - Tracker is active
 * @property {string} INACTIVE - Tracker is inactive
 * @property {string} COMPLETED - Tracker has been completed
 */
export const ProcurementTrackerStatus = {
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
