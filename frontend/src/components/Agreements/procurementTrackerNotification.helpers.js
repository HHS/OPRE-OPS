import PropTypes from "prop-types";

/**
 * Check if notification indicates approval based on step status
 * @param {Object} notification - Notification object with procurement_tracker_step
 * @returns {boolean} True if approval_status is APPROVED
 */
export const isApprovedNotification = (notification) => {
    return notification.procurement_tracker_step?.approval_status === "APPROVED";
};

/**
 * Check if notification indicates decline based on step status
 * @param {Object} notification - Notification object with procurement_tracker_step
 * @returns {boolean} True if approval_status is DECLINED
 */
export const isDeclinedNotification = (notification) => {
    return notification.procurement_tracker_step?.approval_status === "DECLINED";
};

export const procurementTrackerNotificationShape = PropTypes.shape({
    id: PropTypes.number.isRequired,
    notification_type: PropTypes.string.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    is_read: PropTypes.bool.isRequired,
    procurement_tracker_step: PropTypes.shape({
        id: PropTypes.number,
        step_type: PropTypes.string,
        approval_status: PropTypes.string,
        approval_requested: PropTypes.bool
    })
});
