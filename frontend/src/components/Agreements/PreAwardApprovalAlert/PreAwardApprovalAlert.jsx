import { useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import { useDismissNotificationMutation } from "../../../api/opsAPI";

// Keywords for identifying notification types
const APPROVAL_KEYWORDS = ["approved", "approval granted"];
const DECLINE_KEYWORDS = ["declined", "rejected", "denial"];

/**
 * Check if notification title indicates approval
 * @param {string} title - Notification title
 * @returns {boolean} True if title contains approval keywords
 */
const isApprovedNotification = (title) => {
    const lowerTitle = title?.toLowerCase() || "";
    return APPROVAL_KEYWORDS.some((keyword) => lowerTitle.includes(keyword));
};

/**
 * Check if notification title indicates decline
 * @param {string} title - Notification title
 * @returns {boolean} True if title contains decline keywords
 */
const isDeclinedNotification = (title) => {
    const lowerTitle = title?.toLowerCase() || "";
    return DECLINE_KEYWORDS.some((keyword) => lowerTitle.includes(keyword));
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
 * @param {Function} props.setIsVisible - Callback to set visibility state
 * @returns {React.ReactElement|null} The rendered component or null if no notifications
 */
function PreAwardApprovalAlert({ notifications, isVisible, setIsVisible }) {
    const [dismissNotification, { isError }] = useDismissNotificationMutation();

    // Filter for unread pre-award approval RESPONSE notifications (Approved/Declined only)
    // Exclude "Request" notifications - those are for approvers in NotificationCenter only
    const preAwardNotifications = useMemo(
        () =>
            notifications?.filter(
                (n) =>
                    !n.is_read &&
                    n.notification_type === "PRE_AWARD_APPROVAL_NOTIFICATION" &&
                    (isApprovedNotification(n.title) || isDeclinedNotification(n.title))
            ) || [],
        [notifications]
    );

    // Auto-hide component when all notifications are dismissed
    // Using useEffect prevents race condition with async mutation
    useEffect(() => {
        if (isVisible && preAwardNotifications.length === 0) {
            setIsVisible(false);
        }
    }, [preAwardNotifications, isVisible, setIsVisible]);

    const handleDismiss = (notificationId) => {
        dismissNotification(notificationId);
    };

    // Don't render if not visible or no notifications
    if (!isVisible || preAwardNotifications.length === 0) {
        return null;
    }

    // Helper to determine alert type based on title
    const getAlertType = (title) => {
        if (isApprovedNotification(title)) {
            return "success";
        }
        if (isDeclinedNotification(title)) {
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
                const alertType = getAlertType(notification.title);

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
            is_read: PropTypes.bool.isRequired
        })
    ),
    isVisible: PropTypes.bool.isRequired,
    setIsVisible: PropTypes.func.isRequired
};

export default PreAwardApprovalAlert;
