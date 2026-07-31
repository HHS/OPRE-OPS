import { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import { useDismissNotificationMutation } from "../../../api/opsAPI";
import { useAutoDismissNotifications } from "../../../hooks/useAutoDismissNotifications";
import { isApprovedNotification, procurementTrackerNotificationShape } from "../procurementTrackerNotification.helpers";

/**
 * Alert component for award approval response notifications.
 * Only displays Approved notifications (not "In Review" notifications) — unlike
 * pre-award, the award step has no "Declined" outcome, so there's no decline branch.
 * "In Review" alerts are shown via SimpleAlert based on procurement tracker data.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Object[]} props.notifications - Array of notification objects
 * @param {boolean} props.isVisible - Whether the alert is visible
 * @returns {React.ReactElement|null} The rendered component or null if no notifications
 */
function AwardApprovalAlert({ notifications, isVisible }) {
    const [dismissNotification, { isError }] = useDismissNotificationMutation();

    // Filter for unread award approval RESPONSE notifications (Approved only)
    // Exclude "Request" notifications - those are for approvers in NotificationCenter only
    const awardNotifications = useMemo(
        () =>
            notifications?.filter(
                (n) => !n.is_read && n.notification_type === "AWARD_APPROVAL_NOTIFICATION" && isApprovedNotification(n)
            ) || [],
        [notifications]
    );

    const handleDismiss = useCallback(
        (notificationId) => {
            dismissNotification(notificationId);
        },
        [dismissNotification]
    );

    const dismiss = useAutoDismissNotifications(awardNotifications, handleDismiss);

    // Don't render if not visible or no notifications
    if (!isVisible || awardNotifications.length === 0) {
        return null;
    }

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
            {awardNotifications.map((notification) => (
                <SimpleAlert
                    key={notification.id}
                    type="success"
                    heading={notification.title}
                    message={notification.message}
                    isClosable={true}
                    setIsAlertVisible={() => dismiss(notification.id)}
                />
            ))}
        </>
    );
}

AwardApprovalAlert.propTypes = {
    notifications: PropTypes.arrayOf(procurementTrackerNotificationShape),
    isVisible: PropTypes.bool.isRequired
};

export default AwardApprovalAlert;
