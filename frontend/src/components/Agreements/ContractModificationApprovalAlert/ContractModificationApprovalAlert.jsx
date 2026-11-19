import { useMemo, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import { useDismissNotificationMutation, useGetAgreementContractModificationsByIdQuery } from "../../../api/opsAPI";
import { useAutoDismissNotifications } from "../../../hooks/useAutoDismissNotifications";

const MOD_REQUEST_NOTIFICATION = "CONTRACT_MODIFICATION_REQUEST_NOTIFICATION";

/**
 * Alert component for Contract Modification review outcome notifications (#6546), shown at the
 * agreement level so it's visible regardless of which tab is active -- matching
 * PreAwardApprovalAlert/AwardApprovalAlert's placement, not tied to the Award & Modifications
 * tab's own content (where this used to live, as `ReviewOutcomeAlert`).
 *
 * Only the most recent modification's outcome is ever shown (requests come newest first).
 * Outcomes of earlier modifications on the same agreement are stale, so they're marked read
 * instead of piling up or resurfacing once a newer request supersedes them.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {number} props.agreementId
 * @param {Object[]} props.notifications - Array of notification objects
 * @param {boolean} props.isVisible - Whether the alert is visible
 * @returns {React.ReactElement|null} The rendered component or null if no notifications
 */
function ContractModificationApprovalAlert({ agreementId, notifications, isVisible }) {
    const [dismissNotification, { isError }] = useDismissNotificationMutation();
    const { data: modificationRequests = [], isSuccess: hasLoadedRequests } =
        useGetAgreementContractModificationsByIdQuery(agreementId, {
            skip: !agreementId,
            refetchOnMountOrArgChange: true
        });

    const latestRequestId = modificationRequests[0]?.id;
    const reviewOutcomes = useMemo(
        () =>
            (notifications ?? []).filter(
                (n) =>
                    n.notification_type === MOD_REQUEST_NOTIFICATION &&
                    ["APPROVED", "DECLINED"].includes(n.contract_modification_request?.status)
            ),
        [notifications]
    );
    const latestOutcome = reviewOutcomes.find((n) => n.contract_modification_request.id === latestRequestId);
    const staleOutcomeIds = reviewOutcomes
        .filter((n) => n.contract_modification_request.id !== latestRequestId)
        .map((n) => n.id)
        .join(",");

    useEffect(() => {
        // Wait for the requests to load, so "latest" is known before anything is marked read.
        if (!hasLoadedRequests || !staleOutcomeIds) return;
        staleOutcomeIds.split(",").forEach((id) => dismissNotification(Number(id)));
    }, [hasLoadedRequests, staleOutcomeIds, dismissNotification]);

    const handleDismiss = useCallback(
        (notificationId) => {
            dismissNotification(notificationId);
        },
        [dismissNotification]
    );
    const visibleNotifications = useMemo(() => (latestOutcome ? [latestOutcome] : []), [latestOutcome]);
    const dismiss = useAutoDismissNotifications(visibleNotifications, handleDismiss);

    // Don't render if not visible or no notifications
    if (!isVisible || !latestOutcome) {
        return null;
    }

    const { status, reviewer_notes: reviewerNotes } = latestOutcome.contract_modification_request;
    const approved = status === "APPROVED";

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
            <SimpleAlert
                type={approved ? "success" : "error"}
                heading={latestOutcome.title}
                message={latestOutcome.message}
                isClosable={true}
                setIsAlertVisible={() => dismiss(latestOutcome.id)}
            >
                {!approved && reviewerNotes && (
                    <div className="margin-top-2">
                        <strong>Notes:</strong> {reviewerNotes}
                    </div>
                )}
            </SimpleAlert>
        </>
    );
}

ContractModificationApprovalAlert.propTypes = {
    agreementId: PropTypes.number,
    notifications: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            notification_type: PropTypes.string,
            title: PropTypes.string,
            message: PropTypes.string,
            contract_modification_request: PropTypes.shape({
                id: PropTypes.number,
                status: PropTypes.string,
                reviewer_notes: PropTypes.string
            })
        })
    ),
    isVisible: PropTypes.bool.isRequired
};

export default ContractModificationApprovalAlert;
