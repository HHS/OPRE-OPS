import AwardApprovalAlert from "./AwardApprovalAlert";

const approvedNotification = (overrides) => ({
    id: 1,
    notification_type: "AWARD_APPROVAL_NOTIFICATION",
    title: "Award Approved",
    message: "The award for Agreement Test Agreement has been approved by John Doe.",
    is_read: false,
    procurement_tracker_step: {
        id: 5,
        step_type: "AWARD",
        approval_status: "APPROVED",
        approval_requested: true
    },
    ...overrides
});

export default {
    title: "Features/Agreements/AwardApprovalAlert",
    component: AwardApprovalAlert,
    parameters: {
        docs: {
            description: {
                component:
                    "Displays approved award-approval response notifications as auto-dismissing success " +
                    "alerts. Unlike pre-award, the award step has no decline outcome, so only Approved " +
                    "notifications render here."
            }
        }
    }
};

/** A single approved award notification. */
export const Approved = {
    args: {
        notifications: [approvedNotification()],
        isVisible: true
    }
};

/** Multiple approved notifications render as stacked alerts. */
export const MultipleNotifications = {
    args: {
        notifications: [
            approvedNotification(),
            approvedNotification({
                id: 2,
                message: "The award for Agreement Second Agreement has been approved by Jane Doe."
            })
        ],
        isVisible: true
    }
};

/** Renders nothing when there are no unread approved award notifications. */
export const NoNotifications = {
    args: {
        notifications: [],
        isVisible: true
    }
};
