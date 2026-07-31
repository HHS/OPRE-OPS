import { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import { useDismissNotificationMutation } from "../../../api/opsAPI";
import { useAutoDismissNotifications } from "../../../hooks/useAutoDismissNotifications";
import {
    isApprovedNotification,
    isDeclinedNotification,
    procurementTrackerNotificationShape
} from "../procurementTrackerNotification.helpers";

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

    const handleDismiss = useCallback(
        (notificationId) => {
            dismissNotification(notificationId);
        },
        [dismissNotification]
    );

    const dismiss = useAutoDismissNotifications(preAwardNotifications, handleDismiss);

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
                        setIsAlertVisible={() => dismiss(notification.id)}
                    />
                );
            })}
        </>
    );
}

PreAwardApprovalAlert.propTypes = {
    notifications: PropTypes.arrayOf(procurementTrackerNotificationShape),
    isVisible: PropTypes.bool.isRequired
};

export default PreAwardApprovalAlert;
