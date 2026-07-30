import { useMemo, useEffect, useCallback, useRef } from "react";
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

    // Track which notification IDs have timers to prevent duplicate timers
    const timerRefs = useRef(new Map());

    // Auto-dismiss approved notifications after 6 seconds (each notification gets its own independent timer)
    useEffect(() => {
        const timers = timerRefs.current;

        // Cancel timers for notifications that are no longer in the list
        const currentIds = new Set(awardNotifications.map((n) => n.id));
        timers.forEach((timer, id) => {
            if (!currentIds.has(id)) {
                clearTimeout(timer);
                timers.delete(id);
            }
        });

        // Start new timers for notifications that don't have timers yet
        awardNotifications.forEach((notification) => {
            if (!timers.has(notification.id)) {
                const timer = setTimeout(() => {
                    handleDismiss(notification.id);
                    timers.delete(notification.id);
                }, 6000);

                timers.set(notification.id, timer);
            }
        });
    }, [awardNotifications, handleDismiss]);

    // Cleanup all timers on unmount only
    useEffect(() => {
        const timers = timerRefs.current;
        return () => {
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, []);

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
                    setIsAlertVisible={() => handleDismiss(notification.id)}
                />
            ))}
        </>
    );
}

AwardApprovalAlert.propTypes = {
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

export default AwardApprovalAlert;
