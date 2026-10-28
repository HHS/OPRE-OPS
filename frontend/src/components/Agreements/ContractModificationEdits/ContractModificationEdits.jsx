import * as React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    useDismissNotificationMutation,
    useGetAgreementContractModificationEditsByIdQuery,
    useGetAgreementContractModificationsByIdQuery,
    useGetNotificationsByUserIdAndAgreementIdQuery
} from "../../../api/opsAPI";
import { useCanEditByRole } from "../../../hooks/user.hooks";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import DisabledButtonWithTooltip from "../../UI/Button/DisabledButtonWithTooltip";
import ContractModificationEditCard from "./ContractModificationEditCard";

const MOD_REQUEST_NOTIFICATION = "CONTRACT_MODIFICATION_REQUEST_NOTIFICATION";

/**
 * The submitter's Approved / Declined alert for a contract modification.
 * @param {Object} props
 * @param {Object} props.notification - A CONTRACT_MODIFICATION_REQUEST_NOTIFICATION
 * @param {Function} props.onDismiss
 */
const ReviewOutcomeAlert = ({ notification, onDismiss }) => {
    const { status, reviewer_notes: reviewerNotes } = notification.contract_modification_request;
    const approved = status === "APPROVED";
    return (
        <SimpleAlert
            type={approved ? "success" : "error"}
            heading={notification.title}
            message={notification.message}
            isClosable={true}
            setIsAlertVisible={onDismiss}
            headingLevel={2}
        >
            {!approved && reviewerNotes && (
                <div className="margin-top-2">
                    <strong>Notes:</strong> {reviewerNotes}
                </div>
            )}
        </SimpleAlert>
    );
};

/**
 * "Contract Modifications" section of the Award & Modifications tab. Lists the approved
 * edits made in OPS since the agreement was awarded that still require a contract
 * modification to update the actual contract (OPS-3072), and starts the modification (#3268).
 * Edits stay listed, marked In Review, until the Division Director approves the modification.
 *
 * @component
 * @param {Object} props
 * @param {number} props.agreementId
 * @param {boolean} [props.isAgreementEditable] - The agreement's `_meta.isEditable` (team membership)
 * @returns {React.ReactElement | null}
 */
const ContractModificationEdits = ({ agreementId, isAgreementEditable = false }) => {
    const navigate = useNavigate();
    const activeUser = useSelector((state) => state.auth.activeUser);
    const {
        data: edits,
        isLoading,
        isError
    } = useGetAgreementContractModificationEditsByIdQuery(agreementId, {
        skip: !agreementId,
        refetchOnMountOrArgChange: true
    });
    const { data: modificationRequests = [], isSuccess: hasLoadedRequests } =
        useGetAgreementContractModificationsByIdQuery(agreementId, {
            skip: !agreementId,
            refetchOnMountOrArgChange: true
        });
    const { data: notifications = [] } = useGetNotificationsByUserIdAndAgreementIdQuery(
        { user_oidc_id: activeUser?.oidc_id, agreement_id: agreementId },
        { skip: !activeUser?.oidc_id || !agreementId }
    );
    const [dismissNotification] = useDismissNotificationMutation();
    const canEditByRole = useCanEditByRole();

    // Only the most recent modification's outcome is shown (requests come newest first). Outcomes
    // of earlier modifications are stale, so they're marked read instead of piling up.
    const latestRequestId = modificationRequests[0]?.id;
    const reviewOutcomes = notifications.filter(
        (notification) =>
            notification.notification_type === MOD_REQUEST_NOTIFICATION &&
            ["APPROVED", "DECLINED"].includes(notification.contract_modification_request?.status)
    );
    const latestOutcome = reviewOutcomes.find(
        (notification) => notification.contract_modification_request.id === latestRequestId
    );
    const staleOutcomeIds = reviewOutcomes
        .filter((notification) => notification.contract_modification_request.id !== latestRequestId)
        .map((notification) => notification.id)
        .join(",");

    React.useEffect(() => {
        // Wait for the requests to load, so "latest" is known before anything is marked read.
        if (!hasLoadedRequests || !staleOutcomeIds) return;
        staleOutcomeIds.split(",").forEach((id) => dismissNotification(Number(id)));
    }, [hasLoadedRequests, staleOutcomeIds, dismissNotification]);

    if (isLoading) {
        return null;
    }

    const isInReview = modificationRequests.some((request) => request.status === "IN_REVIEW");

    let content;
    if (isError) {
        content = <div>Error loading edits that require a contract modification.</div>;
    } else if (edits?.length) {
        content = (
            <ul
                className="usa-list--unstyled display-flex flex-column"
                style={{ gap: "1rem" }}
            >
                {edits.map((edit) => (
                    <li key={edit.id}>
                        <ContractModificationEditCard edit={edit} />
                    </li>
                ))}
            </ul>
        );
    }

    // Only team members with an editing role can start one (the page itself requires it).
    let disabledReason = null;
    if (!isAgreementEditable || !canEditByRole) {
        disabledReason = "Only team members on this agreement can start a Contract Modification";
    } else if (isInReview) {
        disabledReason = "A Contract Modification is already in review for this agreement";
    }

    return (
        <section
            className="margin-bottom-6"
            data-cy="contract-modifications-section"
        >
            {latestOutcome && (
                <ReviewOutcomeAlert
                    notification={latestOutcome}
                    onDismiss={() => dismissNotification(latestOutcome.id)}
                />
            )}
            {isInReview && (
                <SimpleAlert
                    type="warning"
                    heading="Contract Modification In Review"
                    message="There is a Contract Modification pending approval from the Division Director."
                    headingLevel={2}
                />
            )}
            <h2 className="font-sans-lg">Contract Modifications</h2>
            <p className="font-sans-sm line-height-body-5">
                After an agreement has been awarded, it will require a Contract Modification in order to make changes or
                to execute planned budget lines as-is. If edits have been made in OPS since the agreement was awarded,
                they will be displayed below as a reference. When you are ready to execute a modification, click Start
                Modification below.
            </p>
            {content && (
                <>
                    <h3 className="font-sans-3xs text-normal text-base-dark margin-bottom-3">
                        Edits That Require a Contract Modification
                    </h3>
                    {content}
                </>
            )}
            <div className="display-flex flex-justify-end margin-top-4">
                {disabledReason ? (
                    // Focusable wrapper so keyboard users can reach the reason (a disabled button can't take focus).
                    <DisabledButtonWithTooltip
                        label={disabledReason}
                        dataCy="start-modification-btn"
                    >
                        Start modification
                    </DisabledButtonWithTooltip>
                ) : (
                    <button
                        type="button"
                        className="usa-button"
                        data-cy="start-modification-btn"
                        onClick={() => navigate(`/agreements/${agreementId}/start-modification`)}
                    >
                        Start modification
                    </button>
                )}
            </div>
        </section>
    );
};

export default ContractModificationEdits;
