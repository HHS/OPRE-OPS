import { useMemo } from "react";
import PropTypes from "prop-types";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import { useDismissNotificationMutation } from "../../../api/opsAPI";

/**
 * Check if notification indicates approval based on step status
 * @param {Object} notification - Notification object with procurement_tracker_step
 * @returns {boolean} True if approval_status is APPROVED
 */
const isApprovedNotification = (notification) => {
    return notification.procurement_tracker_step?.approval_status === "APPROVED";
};

/**
 * Check if notification indicates decline based on step status
 * @param {Object} notification - Notification object with procurement_tracker_step
 * @returns {boolean} True if approval_status is DECLINED
 */
const isDeclinedNotification = (notification) => {
    return notification.procurement_tracker_step?.approval_status === "DECLINED";
};

/**
 * Alert component for pre-award approval response notifications.
 * Only displays Approved/Declined notifications (not "In Review" notifications).
 * "In Review" alerts are shown via SimpleAlert based on procurement tracker data.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Object[]} props.notifications - Array of notification objects
 * @param {boolean} props.isVisible - Whether the alert is visible
 * @returns {React.ReactElement|null} The rendered component or null if no notifications
 */
function PreAwardApprovalAlert({ notifications, isVisible }) {
    const [dismissNotification, { isError }] = useDismissNotificationMutation();

    // Filter for unread pre-award approval RESPONSE notifications (Approved/Declined only)
    // Exclude "Request" notifications - those are for approvers in NotificationCenter only
    const preAwardNotifications = useMemo(
        () =>
            notifications?.filter(
                (n) =>
                    !n.is_read &&
                    n.notification_type === "PRE_AWARD_APPROVAL_NOTIFICATION" &&
                    (isApprovedNotification(n) || isDeclinedNotification(n))
            ) || [],
        [notifications]
    );

    const handleDismiss = (notificationId) => {
        dismissNotification(notificationId);
    };

    // Don't render if not visible or no notifications
    if (!isVisible || preAwardNotifications.length === 0) {
        return null;
    }

    // Helper to determine alert type based on approval status
    const getAlertType = (notification) => {
        if (isApprovedNotification(notification)) {
            return "success";
        }
        if (isDeclinedNotification(notification)) {
            return "error";
        }
        return "warning";
    };

    return (
        <>
            {isError && (
                <SimpleAlert
                    type="error"
                    heading="Error"
                    message="Failed to dismiss notification. Please try again."
                    isClosable={false}
                />
            )}
            {preAwardNotifications.map((notification) => {
                const alertType = getAlertType(notification);

                return (
                    <SimpleAlert
                        key={notification.id}
                        type={alertType}
                        heading={notification.title}
                        message={notification.message}
                        isClosable={true}
                        setIsAlertVisible={() => handleDismiss(notification.id)}
                    />
                );
            })}
        </>
    );
}

PreAwardApprovalAlert.propTypes = {
    notifications: PropTypes.arrayOf(
        PropTypes.shape({
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
        })
    ),
    isVisible: PropTypes.bool.isRequired
};

export default PreAwardApprovalAlert;
